// db/conn.mjs
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectionString = process.env.ATLAS_URL;

if (!connectionString || (!connectionString.startsWith("mongodb://") && !connectionString.startsWith("mongodb+srv://"))) {
    console.error("❌ Invalid or missing MongoDB connection string in .env file");
    process.exit(1);
}

console.log("✅ MongoDB connection string loaded");

const client = new MongoClient(connectionString);

let db;
try {
    await client.connect();
    db = client.db("customer_payments");
    console.log("🟢 MongoDB Connected Successfully!");
} catch (e) {
    console.error("❌ MongoDB connection error:", e.message);
    process.exit(1);
}

export default db;
