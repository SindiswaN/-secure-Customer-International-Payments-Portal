import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import checkauth from "../checkauth.mjs";
import { validatePayment, sanitizeInput } from "../validation.mjs";

const router = express.Router();

// --------------------------
// DEBUG: Test database connection
// --------------------------
router.get("/test-db", async (req, res) => {
  try {
    const collection = await db.collection("payments");
    const count = await collection.countDocuments();
    
    res.json({ 
      message: "Database connected successfully",
      totalPayments: count,
      database: db.databaseName,
      collection: "payments"
    });
  } catch (error) {
    console.error("Database connection error:", error);
    res.status(500).json({ 
      message: "Database connection failed",
      error: error.message 
    });
  }
});

// --------------------------
// DEBUG: Get all data for troubleshooting
// --------------------------
router.get("/debug-data", checkauth, async (req, res) => {
  try {
    if (req.userData.role !== "employee") {
      return res.status(403).json({ message: "Employees only" });
    }

    const paymentsCollection = await db.collection("payments");
    const payments = await paymentsCollection.find().toArray();

    // Try to get users if the collection exists
    let users = [];
    try {
      const usersCollection = await db.collection("users");
      users = await usersCollection.find().toArray();
    } catch (e) {
      console.log("Users collection not found or error:", e.message);
    }

    res.json({
      totalPayments: payments.length,
      payments: payments,
      totalUsers: users.length,
      users: users.map(u => ({ 
        id: u._id, 
        username: u.username, 
        email: u.email, 
        role: u.role,
        userId: u.userId 
      }))
    });
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ message: "Debug failed", error: error.message });
  }
});

// --------------------------
// Create payment (CUSTOMER ONLY)
// --------------------------
router.post("/create", checkauth, async (req, res) => {
  try {
    console.log("=== PAYMENT CREATION REQUEST ===");
    console.log("User Data:", req.userData);
    console.log("Request Body:", req.body);

    if (req.userData.role === "employee") {
      return res.status(403).json({
        message: "Employees cannot create payments. Use the verification portal instead.",
      });
    }

    // Sanitize input
    const paymentData = {
      customerId: req.userData.userId,
      customerName: req.userData.username,
      sourceAccount: sanitizeInput(req.body.sourceAccount),
      targetAccount: sanitizeInput(req.body.targetAccount),
      beneficiaryName: sanitizeInput(req.body.beneficiaryName),
      beneficiaryBank: sanitizeInput(req.body.beneficiaryBank),
      amount: sanitizeInput(req.body.amount),
      currency: sanitizeInput(req.body.currency),
      purpose: sanitizeInput(req.body.purpose),
      createdAt: new Date(),
      status: "pending",
      reference: `PAY-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    };

    console.log("📝 Payment data prepared:", paymentData);

    // Validate fields
    const validationErrors = validatePayment(paymentData);
    if (validationErrors.length > 0) {
      console.log("❌ Validation failed:", validationErrors);
      return res.status(400).json({
        message: "Validation failed",
        errors: validationErrors,
      });
    }

    const amount = parseFloat(paymentData.amount);
    if (isNaN(amount) || amount <= 0) {
      console.log("❌ Invalid amount:", paymentData.amount);
      return res.status(400).json({ message: "Invalid amount" });
    }
    if (amount < 10) {
      console.log("❌ Amount too low:", amount);
      return res.status(400).json({ message: "Minimum payment amount is 10" });
    }
    if (amount > 100000) {
      console.log("❌ Amount too high:", amount);
      return res.status(400).json({ message: "Maximum payment amount is 100,000" });
    }

    // Insert into MongoDB
    console.log("💾 Inserting payment into database...");
    const collection = await db.collection("payments");
    const result = await collection.insertOne(paymentData);

    // Verify the payment was saved
    const savedPayment = await collection.findOne({ _id: result.insertedId });
    console.log("✅ Payment saved to database:", savedPayment);

    console.log(`✅ Payment created successfully: ${paymentData.reference} (${paymentData.amount} ${paymentData.currency})`);

    res.status(201).json({
      message: "Payment request created successfully",
      paymentId: result.insertedId,
      reference: paymentData.reference,
      status: paymentData.status,
      amount: paymentData.amount,
      currency: paymentData.currency,
      timestamp: paymentData.createdAt,
    });
  } catch (error) {
    console.error("🔥 Payment creation error:", error);
    res.status(500).json({ 
      message: "Payment creation failed",
      error: error.message 
    });
  }
});

// --------------------------
// Get payments by logged-in customer
// --------------------------
router.get("/my-payments", checkauth, async (req, res) => {
  try {
    console.log("📋 Getting payments for customer:", req.userData.userId);
    
    if (req.userData.role === "employee") {
      return res.status(403).json({
        message: "Employees cannot access customer payment list.",
      });
    }

    const collection = await db.collection("payments");
    const payments = await collection
      .find({ customerId: req.userData.userId })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${payments.length} payments for customer ${req.userData.userId}`);
    
    res.json({ payments });
  } catch (error) {
    console.error("Error loading payments:", error);
    res.status(500).json({ message: "Failed to load payments" });
  }
});

// --------------------------
// Get all pending payments (EMPLOYEE ONLY)
// --------------------------
router.get("/pending", checkauth, async (req, res) => {
  try {
    console.log("👨‍💼 Employee requesting pending payments:", req.userData.username);
    
    if (req.userData.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can view pending payments.",
      });
    }

    const collection = await db.collection("payments");
    const payments = await collection
      .find({ status: "pending" })
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${payments.length} pending payments for employee`);
    
    res.json({ payments });
  } catch (error) {
    console.error("Error fetching pending payments:", error);
    res.status(500).json({ message: "Failed to load pending payments" });
  }
});

// --------------------------
// Get all payments (EMPLOYEE ONLY)
// --------------------------
router.get("/all", checkauth, async (req, res) => {
  try {
    console.log("👨‍💼 Employee requesting all payments:", req.userData.username);
    
    if (req.userData.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can view all payments.",
      });
    }

    const collection = await db.collection("payments");
    const payments = await collection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    console.log(`✅ Found ${payments.length} total payments for employee`);
    
    res.json({ payments });
  } catch (error) {
    console.error("Error fetching all payments:", error);
    res.status(500).json({ message: "Failed to load payments" });
  }
});

// --------------------------
// Approve / Reject payment (EMPLOYEE ONLY)
// --------------------------
router.patch("/:id/status", checkauth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log(`🔄 Employee ${req.userData.username} updating payment ${id} to ${status}`);

    if (req.userData.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can update payment status.",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const collection = await db.collection("payments");
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status,
          reviewedBy: req.userData.username,
          reviewedAt: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0) {
      console.log("❌ Payment not found:", id);
      return res.status(404).json({ message: "Payment not found" });
    }

    console.log(`✅ Payment ${id} ${status} successfully by ${req.userData.username}`);
    
    res.json({ message: `Payment ${status} successfully` });
  } catch (error) {
    console.error("Error updating payment status:", error);
    res.status(500).json({ message: "Failed to update payment status" });
  }
});

// --------------------------
// Payment statistics for dashboard (EMPLOYEE ONLY)
// --------------------------
router.get("/stats", checkauth, async (req, res) => {
  try {
    if (req.userData.role !== "employee") {
      return res.status(403).json({
        message: "Only employees can view statistics.",
      });
    }

    const collection = await db.collection("payments");

    const totalPayments = await collection.countDocuments();
    const pending = await collection.countDocuments({ status: "pending" });
    const approved = await collection.countDocuments({ status: "approved" });
    const rejected = await collection.countDocuments({ status: "rejected" });
    const completed = await collection.countDocuments({ status: "completed" });

    const latestPayments = await collection
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();

    res.json({
      totalPayments,
      pending,
      approved,
      rejected,
      completed,
      latestPayments,
    });
  } catch (error) {
    console.error("Error loading stats:", error);
    res.status(500).json({ message: "Failed to load statistics" });
  }
});

export default router;