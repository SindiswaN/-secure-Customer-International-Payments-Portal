import express from "express";
import db from "../db/conn.mjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";
import { ObjectId } from "mongodb";

const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store, {
    freeRetries: 5000,
    minWait: 5*60*1000,
    maxWait: 60*60*1000,
    lifetime: 24*60*60
});

// Combined login for both customers and employees
router.post('/login', bruteforce.prevent, async (req, res) => {
    try {
        console.log("🔑 Login attempt for:", req.body.username, "Role:", req.body.role);
        
        const { username, password, role = "customer" } = req.body;

        if (!username || !password) {
            return res.status(400).json({ 
                message: "Username and password are required" 
            });
        }

        // Determine which collection to query based on role
        const collectionName = role === "employee" ? "employees" : "customers";
        const collection = await db.collection(collectionName);
        const user = await collection.findOne({ username });

        if (!user) {
            console.log("❌ User not found:", username, "in collection:", collectionName);
            await bcrypt.compare(password, "$2b$12$fakeHashForTimingAttackPrevention");
            return res.status(400).json({ 
                message: `Authentication failed - ${role} not found` 
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            console.log("❌ Password incorrect for user:", username);
            return res.status(400).json({ 
                message: "Authentication failed - incorrect password" 
            });
        }

        const userIdString = user._id.toString();

        // Create token with role information
        const token = jwt.sign(
            { 
                userId: userIdString,
                username: user.username,
                role: role,
                fullName: user.fullName || user.username
            },
            process.env.JWT_SECRET || "this_secret_should_be_much_longer_and_in_env_variables",
            { expiresIn: "24h" }
        );

        console.log(`✅ Login successful for ${role}:`, username);

        res.status(200).json({ 
            message: "Authentication successful", 
            token: token,
            user: {
                username: user.username,
                fullName: user.fullName || user.username,
                userId: userIdString,
                role: role
            }
        });

    } catch(error) {
        console.error("Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
});

// Get current logged-in user info for dashboard
router.get("/me", async (req, res) => {
    try {
        const authHeader = req.headers.authorization || "";
        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Unauthorized" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "this_secret_should_be_much_longer_and_in_env_variables");
        const userId = decoded.userId;
        const role = decoded.role;

        // Query the appropriate collection based on role
        const collectionName = role === "employee" ? "employees" : "customers";
        let user = await db.collection(collectionName).findOne({ _id: new ObjectId(userId) });
        
        if (!user) return res.status(404).json({ message: "User not found" });

        res.status(200).json({
            name: user.fullName || user.username,
            username: user.username,
            userId: user._id.toString(),
            role: role,
        });
    } catch (err) {
        console.error("GET /user/me error:", err.message);
        res.status(401).json({ message: "Invalid token" });
    }
});

// Customer registration (optional - for demo purposes)
router.post('/register', async (req, res) => {
    try {
        const { username, password, fullName, email } = req.body;

        if (!username || !password || !fullName) {
            return res.status(400).json({ 
                message: "Username, password, and full name are required" 
            });
        }

        const customersCollection = await db.collection("customers");
        
        // Check if user already exists
        const existingUser = await customersCollection.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ 
                message: "Username already exists" 
            });
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create customer
        const result = await customersCollection.insertOne({
            username,
            password: hashedPassword,
            fullName,
            email: email || "",
            createdAt: new Date(),
            role: "customer"
        });

        res.status(201).json({
            message: "Customer registered successfully",
            userId: result.insertedId
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({ message: "Registration failed" });
    }
});

export default router;