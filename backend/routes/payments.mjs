import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import checkauth from "../checkauth.mjs";
import { validationPatterns, validateInput, sanitizeInput, validatePayment } from "../validation.mjs";

const router = express.Router();

// Create international payment
router.post("/create", checkauth, async (req, res) => {
    try {
        console.log("Payment creation request from:", req.userData.username);
        
        // Sanitize all inputs
        const paymentData = {
            fromAccount: sanitizeInput(req.body.fromAccount),
            toAccount: sanitizeInput(req.body.toAccount),
            beneficiaryName: sanitizeInput(req.body.beneficiaryName),
            beneficiaryBank: sanitizeInput(req.body.beneficiaryBank),
            amount: sanitizeInput(req.body.amount),
            currency: sanitizeInput(req.body.currency),
            purpose: sanitizeInput(req.body.purpose),
            userId: req.userData.userId,
            username: req.userData.username,
            createdAt: new Date(),
            status: "pending",
            reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        // Comprehensive validation
        const validationErrors = validatePayment(paymentData);
        if (validationErrors.length > 0) {
            return res.status(400).json({ 
                message: "Validation failed", 
                errors: validationErrors 
            });
        }

        const amount = parseFloat(paymentData.amount);
        
        // Additional business logic validation
        if (amount < 10) {
            return res.status(400).json({ 
                message: "Minimum payment amount is 10" 
            });
        }

        if (amount > 100000) {
            return res.status(400).json({ 
                message: "Maximum payment amount is 100,000" 
            });
        }

        // Store payment in database
        let collection = await db.collection("payments");
        let result = await collection.insertOne(paymentData);
        
        // Log payment creation (for audit trail)
        console.log(`💰 Payment created: ${paymentData.reference} by ${paymentData.username} for ${amount} ${paymentData.currency}`);
        
        res.status(201).json({
            message: "International payment created successfully",
            paymentId: result.insertedId,
            reference: paymentData.reference,
            status: "pending",
            amount: paymentData.amount,
            currency: paymentData.currency,
            timestamp: paymentData.createdAt
        });

    } catch (error) {
        console.error("Payment creation error:", error);
        res.status(500).json({ message: "Payment creation failed" });
    }
});

// Get user's payment history with pagination
router.get("/history", checkauth, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        let collection = await db.collection("payments");
        let payments = await collection.find({ 
            userId: req.userData.userId 
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();
        
        const total = await collection.countDocuments({ userId: req.userData.userId });
        
        res.status(200).json({
            payments,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Payment history error:", error);
        res.status(500).json({ message: "Failed to retrieve payment history" });
    }
});

// Get specific payment details
router.get("/:id", checkauth, async (req, res) => {
    try {
        let collection = await db.collection("payments");
        let payment = await collection.findOne({ 
            _id: new ObjectId(req.params.id),
            userId: req.userData.userId 
        });

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json(payment);
    } catch (error) {
        console.error("Payment details error:", error);
        res.status(500).json({ message: "Failed to retrieve payment details" });
    }
});

// Update payment status (admin function - for demonstration)
router.patch("/:id/status", checkauth, async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "processing", "completed", "failed", "cancelled"];
        
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: "Invalid status" });
        }

        let collection = await db.collection("payments");
        let result = await collection.updateOne(
            { 
                _id: new ObjectId(req.params.id),
                userId: req.userData.userId 
            },
            { 
                $set: { 
                    status: status,
                    updatedAt: new Date()
                } 
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({ message: "Payment not found" });
        }

        res.status(200).json({
            message: "Payment status updated successfully",
            status: status
        });
    } catch (error) {
        console.error("Payment status update error:", error);
        res.status(500).json({ message: "Failed to update payment status" });
    }
});

// Get payment statistics
router.get("/dashboard/stats", checkauth, async (req, res) => {
    try {
        let collection = await db.collection("payments");
        
        const totalPayments = await collection.countDocuments({ 
            userId: req.userData.userId 
        });
        
        const totalAmount = await collection.aggregate([
            { $match: { userId: req.userData.userId } },
            { $group: { _id: null, total: { $sum: { $toDouble: "$amount" } } } }
        ]).toArray();
        
        const recentPayments = await collection.find({ 
            userId: req.userData.userId 
        })
        .sort({ createdAt: -1 })
        .limit(5)
        .toArray();

        res.status(200).json({
            totalPayments,
            totalAmount: totalAmount[0]?.total || 0,
            recentPayments
        });
    } catch (error) {
        console.error("Dashboard stats error:", error);
        res.status(500).json({ message: "Failed to retrieve dashboard statistics" });
    }
});

export default router;