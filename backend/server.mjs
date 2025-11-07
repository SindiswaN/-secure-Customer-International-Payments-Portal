// server.mjs
import express from "express";
import https from "https";
import fs from "fs";
import path, { join } from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

import posts from "./routes/post.mjs";
import users from "./routes/user.mjs";
import payments from "./routes/payments.mjs";
import employeeRoutes from "./routes/employee.mjs";

import db from "./db/conn.mjs"; // Single MongoDB connection

// Resolve __dirname
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables
dotenv.config({ path: path.join(__dirname, '.env') });

// App setup
const app = express();
const PORT = 5001;

// SSL options
const options = {
    // key: fs.readFileSync(path.join(__dirname, 'keys/privatekey.pem')),
    // cert: fs.readFileSync(path.join(__dirname, 'keys/certificate.pem'))

  key: fs.readFileSync(join(__dirname, 'keys', 'privatekey.pem')),
  cert: fs.readFileSync(join(__dirname, 'keys', 'certificate.pem'))

};

// ------------------- SIMPLE CORS SETUP -------------------
const allowedOrigins = [
    'http://localhost:3000',
    'https://localhost:3000',
    'http://127.0.0.1:3000',
    'https://127.0.0.1:3000'
];

// Manual CORS middleware - NO EXTERNAL DEPENDENCIES
app.use((req, res, next) => {
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Allow-Credentials', 'true');

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    next();
});
// ----------------------------------------------------

// Security
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP'
});
app.use(limiter);

// Body parser
app.use(express.json({ limit: '10mb' }));

// Custom headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Routes
app.use("/post", posts);
app.use("/user", users);
app.use("/payments", payments);
app.use("/employee", employeeRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        secure: true,
        protocol: 'HTTPS',
        cors: 'Enabled',
        allowedOrigins: allowedOrigins
    });
});

// CORS test endpoint
app.get('/cors-test', (req, res) => {
    res.status(200).json({
        message: 'CORS is working!',
        origin: req.headers.origin,
        corsEnabled: true,
        timestamp: new Date().toISOString()
    });
});

// Start HTTPS
https.createServer(options, app).listen(PORT, () => {
    console.log(`🔒 Secure Payment Portal API running on HTTPS port ${PORT}`);
    console.log(`📋 Health check: https://localhost:${PORT}/health`);
    console.log(`🔍 CORS test: https://localhost:${PORT}/cors-test`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});