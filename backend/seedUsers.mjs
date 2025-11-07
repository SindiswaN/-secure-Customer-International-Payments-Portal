// seedUsers.mjs
import bcrypt from "bcrypt";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, ".env") });

async function seedUsers() {
  const client = new MongoClient(process.env.ATLAS_URL);

  try {
    await client.connect();
    const db = client.db("customer_payments");
    const employees = db.collection("employees");
    const customers = db.collection("customers");

    console.log("🗑️ Clearing existing users...");
    await employees.deleteMany({});
    await customers.deleteMany({});

    // Hash passwords - using the same hash for consistency
    const employeePassword = await bcrypt.hash("admin123", 12);
    const customerPassword = await bcrypt.hash("password123", 12);

    // Insert employees
    console.log("👨‍💼 Seeding employees...");
    const employeeResult = await employees.insertMany([
      {
        username: "admin",
        fullName: "System Administrator",
        password: employeePassword,
        role: "employee",
        isActive: true,
        createdAt: new Date()
      },
      {
        username: "manager",
        fullName: "Payment Manager",
        password: employeePassword,
        role: "employee", 
        isActive: true,
        createdAt: new Date()
      }
    ]);

    console.log("✅ Employees added:", employeeResult.insertedCount);

    // Insert customers
    console.log("👥 Seeding customers...");
    const customerResult = await customers.insertMany([
      {
        username: "john_doe",
        fullName: "John Doe",
        password: customerPassword,
        email: "john.doe@example.com",
        role: "customer",
        isActive: true,
        accountNumber: "ACC123456789",
        createdAt: new Date()
      },
      {
        username: "sarah_smith", 
        fullName: "Sarah Smith",
        password: customerPassword,
        email: "sarah.smith@example.com",
        role: "customer",
        isActive: true,
        accountNumber: "ACC987654321",
        createdAt: new Date()
      },
      {
        username: "mike_johnson",
        fullName: "Mike Johnson",
        password: customerPassword,
        email: "mike.johnson@example.com",
        role: "customer",
        isActive: true,
        accountNumber: "ACC555666777",
        createdAt: new Date()
      }
    ]);

    console.log("✅ Customers added:", customerResult.insertedCount);

    // Verify the data
    const employeeCount = await employees.countDocuments();
    const customerCount = await customers.countDocuments();

    console.log("\n📊 Database Summary:");
    console.log(`👨‍💼 Employees: ${employeeCount}`);
    console.log(`👥 Customers: ${customerCount}`);
    console.log("\n🔑 Login Credentials:");
    console.log("====================");
    console.log("EMPLOYEES:");
    console.log("  Username: admin / manager");
    console.log("  Password: admin123");
    console.log("\nCUSTOMERS:");
    console.log("  Username: john_doe / sarah_smith / mike_johnson");
    console.log("  Password: password123");
    console.log("\n🎯 Login URLs:");
    console.log("  Employee Portal: Select 'Employee' role at login");
    console.log("  Customer Portal: Select 'Customer' role at login");

  } catch (error) {
    console.error("❌ Error seeding users:", error);
  } finally {
    await client.close();
  }
}

seedUsers();