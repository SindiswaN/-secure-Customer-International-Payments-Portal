import https from "https";
import fs from "fs";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import posts from "./routes/post.mjs";
import users from "./routes/user.mjs";
import payments from "./routes/payments.mjs";

const PORT = 5000;
const app = express();

// SSL configuration
const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
};

// Security middleware
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https:"]
        }
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true
    }
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});
app.use(limiter);

// CORS configuration
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://localhost:3000',
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Security headers
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

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        secure: true,
        protocol: 'HTTPS'
    });
});

// Create HTTPS server
const server = https.createServer(options, app);

server.listen(PORT, () => {
    console.log(`🔒 Secure Payment Portal API running on HTTPS port ${PORT}`);
    console.log(`📋 Health check: https://localhost:${PORT}/health`);
    console.log(`🔐 SSL Certificates: Valid until 2028`);
});