import express from "express";
import db from "../db/conn.mjs";
import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import ExpressBrute from "express-brute";

const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store, {
    freeRetries: 5,
    minWait: 5*60*1000,
    maxWait: 60*60*1000,
    lifetime: 24*60*60
});

// Admin registration (secured with secret key)
router.post("/admin/signup", async (req, res) => {
    try {
        console.log("🔐 Admin registration request for:", req.body.name);
        
        // Check admin secret key
        const adminSecret = req.body.adminSecret;
        if (adminSecret !== "ADMIN_SECRET_123") { // Change this in production
            return res.status(401).json({ 
                message: "Invalid admin secret key" 
            });
        }

        if (!req.body.name || !req.body.password) {
            return res.status(400).json({ 
                message: "Name and password are required" 
            });
        }

        // Check if admin already exists
        const collection = await db.collection("users");
        const existingAdmin = await collection.findOne({ 
            name: req.body.name,
            role: "admin" 
        });

        if (existingAdmin) {
            return res.status(400).json({ 
                message: "Admin user already exists" 
            });
        }

        console.log("🔄 Hashing admin password...");
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        console.log("✅ Admin password hashed successfully");

        let newDocument = {
            name: req.body.name,
            password: hashedPassword,
            createdAt: new Date(),
            role: "admin",
            permissions: ["view_all_payments", "manage_users", "system_admin"]
        };
        
        let result = await collection.insertOne(newDocument);
        const userIdString = result.insertedId.toString();
        
        console.log("👑 Admin created with ID:", userIdString);
        
        res.status(201).json({ 
            message: "Admin user created successfully",
            userId: userIdString,
            name: req.body.name,
            role: "admin",
            note: "Admin account created with elevated permissions"
        });
        
    } catch (error) {
        console.error("❌ Admin registration error:", error);
        res.status(500).json({ message: "Admin registration failed" });
    }
});

// Enhanced sign up with proper user ID handling (regular users)
router.post("/signup", async (req, res) => {
    try {
        console.log("🔐 User registration request for:", req.body.name);
        
        if (!req.body.name || !req.body.password) {
            return res.status(400).json({ 
                message: "Name and password are required" 
            });
        }

        // Hash the password with bcrypt
        console.log("🔄 Hashing password...");
        const hashedPassword = await bcrypt.hash(req.body.password, 12);
        console.log("✅ Password hashed successfully");
        console.log("📝 Plain text password:", req.body.password);
        console.log("🔒 Hashed password:", hashedPassword);

        let newDocument = {
            name: req.body.name,
            password: hashedPassword,
            createdAt: new Date(),
            role: "customer",
            permissions: ["create_payments", "view_own_payments"]
        };
        
        let collection = await db.collection("users");
        let result = await collection.insertOne(newDocument);
        
        // Convert ObjectId to string for JWT
        const userIdString = result.insertedId.toString();
        console.log("👤 User created with ID:", userIdString);
        
        // Generate JWT token for immediate login
        const token = jwt.sign(
            { 
                userId: userIdString,
                username: req.body.name,
                role: "customer"
            },
            process.env.JWT_SECRET || "this_secret_should_be_much_longer_and_in_env_variables",
            { expiresIn: "24h" }
        );
        
        console.log("🎫 JWT Token generated for user:", req.body.name);
        
        res.status(201).json({ 
            message: "User created successfully",
            userId: userIdString,
            token: token,
            name: req.body.name,
            role: "customer",
            note: "Password has been securely hashed with bcrypt"
        });
        
    } catch (error) {
        console.error("❌ User registration error:", error);
        res.status(500).json({ message: "Registration failed" });
    }
});

// Enhanced login with role detection
router.post('/login', bruteforce.prevent, async (req, res) => {
    try {
        console.log("🔑 Login attempt for:", req.body.name);
        
        const { name, password } = req.body;

        if (!name || !password) {
            return res.status(400).json({ 
                message: "Name and password are required" 
            });
        }

        const collection = await db.collection('users');
        const user = await collection.findOne({ name });

        if (!user) {
            console.log("❌ User not found:", name);
            // Simulate delay to prevent timing attacks
            await bcrypt.compare(password, "$2b$12$fakeHashForTimingAttackPrevention");
            return res.status(400).json({ message: "Authentication failed - user not found" });
        }

        console.log("✅ User found, comparing passwords...");
        console.log("👤 User role:", user.role);
        
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("🔍 Password match result:", passwordMatch);

        if (!passwordMatch) {
            console.log("❌ Password incorrect for user:", name);
            return res.status(400).json({ message: "Authentication failed - incorrect password" });
        }

        // Convert ObjectId to string for consistent handling
        const userIdString = user._id.toString();
        
        // Generate JWT token with role information
        const token = jwt.sign(
            { 
                userId: userIdString,
                username: user.name,
                role: user.role,
                permissions: user.permissions || []
            },
            process.env.JWT_SECRET || "this_secret_should_be_much_longer_and_in_env_variables",
            { expiresIn: "24h" }
        );

        console.log("✅ Login successful for:", name);
        console.log("🎫 JWT Token generated with role:", user.role);
        console.log("👤 User ID in token:", userIdString);

        res.status(200).json({ 
            message: "Authentication successful", 
            token: token, 
            name: user.name,
            userId: userIdString,
            role: user.role,
            permissions: user.permissions || []
        });

    } catch(error) {
        console.error("❌ Login error:", error);
        res.status(500).json({ message: "Login failed" });
    }
});

// Get all users (admin only)
router.get("/users", async (req, res) => {
    try {
        // In a real app, you'd verify admin role from JWT
        const collection = await db.collection("users");
        const users = await collection.find({}).toArray();
        
        // Remove passwords from response
        const safeUsers = users.map(user => ({
            _id: user._id,
            name: user.name,
            role: user.role,
            createdAt: user.createdAt,
            permissions: user.permissions
        }));
        
        res.status(200).json(safeUsers);
    } catch (error) {
        console.error("❌ Get users error:", error);
        res.status(500).json({ message: "Failed to retrieve users" });
    }
});

export default router;