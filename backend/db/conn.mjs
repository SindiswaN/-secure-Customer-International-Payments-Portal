import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.ATLAS_URL || "";

console.log("MongoDB connection string loaded");

const client = new MongoClient(connectionString);

let conn;
try {
    conn = await client.connect();
    console.log("mongodb is CONNECTED!!! :)");
} catch(e) {
    console.error("MongoDB connection error:", e.message);
}

let db;
if (conn) {
  db = client.db("apds_database");
} else {
  throw new Error("Database connection failed");
}
export default db;