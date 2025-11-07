import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// 🔹 Resolve the path to the backend .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../backend/.env") });

// 🔹 Load MongoDB connection URI
const uri = process.env.ATLAS_URL;
const dbName = process.env.DB_NAME || "customer_payments";

// 🔹 Validate connection string
if (!uri) {
  console.error("❌ ERROR: ATLAS_URL not found. Check your .env file path.");
  process.exit(1);
}

// 🔹 Create MongoDB client
const client = new MongoClient(uri);

// 🔹 Employee accounts to seed (no registration needed)
const employees = [
  {
    username: "alice",
    fullName: "Alice Banda",
    role: "employee",
    password: "StrongPass@123"
  },
  {
    username: "mike",
    fullName: "Michael S.",
    role: "employee",
    password: "AnotherP@ss1"
  }
];

async function run() {
  try {
    console.log("🔗 Connecting to MongoDB...");
    await client.connect();
    console.log("✅ Connected to MongoDB!");

    const db = client.db(dbName);
    const col = db.collection("employees");

    for (const e of employees) {
      const exists = await col.findOne({ username: e.username });

      if (exists) {
        console.log(`⚠️ ${e.username} already exists, skipping.`);
        continue;
      }

      // Hash and salt password (12 rounds)
      const hashed = await bcrypt.hash(e.password, 12);

      const doc = {
        username: e.username,
        fullName: e.fullName,
        password: hashed,
        role: e.role,
        createdAt: new Date(),
        isActive: true
      };

      await col.insertOne(doc);
      console.log(`✅ Inserted ${e.username}`);
    }

    console.log("\n🎉 Employee seeding completed successfully!");
  } catch (err) {
    console.error("❌ Error seeding employees:", err.message);
  } finally {
    await client.close();
    console.log("🔒 MongoDB connection closed.");
  }
}

run();
