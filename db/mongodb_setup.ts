// Adds users and auditLogs collections and drone data to database
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { config } from "@/config";

// Load environment variables
import dotenv from "dotenv";
dotenv.config();

// Load the drone test data
const testDataPath = path.join(__dirname, "../test.json");
const droneTestData = JSON.parse(fs.readFileSync(testDataPath, "utf8"));

async function setupDatabase() {
  const uri = config.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI environment variable is not set.");
    process.exit(1); // Exit the process with an error code
  }
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log(" Connected to MongoDB");

    const db = client.db("junction-boxers");

    // === 1. DRONE DATA (Preserve existing structure) ===
    const dronesCollection = db.collection("drone-data");

    // Clear and reseed only if empty or forced
    const droneCount = await dronesCollection.countDocuments();
    if (droneCount === 0 || process.argv.includes("--force")) {
      await dronesCollection.deleteMany({});
      const result = await dronesCollection.insertMany(droneTestData);
      console.log(`Inserted ${result.insertedCount} drone records`);
    } else {
      console.log(
        `Skipped seeding drones: ${droneCount} records already exist`,
      );
    }

    // Create indexes for performance
    await dronesCollection.createIndex({ droneId: 1 }, { unique: true });
    await dronesCollection.createIndex({ status: 1 });
    await dronesCollection.createIndex({ owner: 1 });
    await dronesCollection.createIndex({
      "location.latitude": 1,
      "location.longitude": 1,
    });
    await dronesCollection.createIndex({ "pilot.pilotId": 1 });

    // === 2. USERS COLLECTION ===
    const usersCollection = db.collection("users");

    // Sample internal/team users (not public)
    const seedUsers = [
      {
        userId: "U-001",
        username: "admin@junction.com",
        role: "admin",
        firstName: "Sam",
        lastName: "Taylor",
        department: "Operations",
        lastLogin: new Date(),
        isActive: true,
        permissions: ["query_drones", "view_audit", "manage_users"],
        createdAt: new Date(),
      },
      {
        userId: "U-002",
        username: "agent@junction.com",
        role: "agent",
        firstName: "Jordan",
        lastName: "Lee",
        department: "Field Ops",
        lastLogin: new Date(Date.now() - 86400000), // yesterday
        isActive: true,
        permissions: ["query_drones"],
        createdAt: new Date(),
      },
    ];

    const userCount = await usersCollection.countDocuments();
    if (userCount === 0) {
      await usersCollection.deleteMany({});
      const result = await usersCollection.insertMany(seedUsers);
      console.log(`👥 Inserted ${result.insertedCount} user records`);
    } else {
      console.log(
        `👥 Skipped seeding users: ${userCount} records already exist`,
      );
    }

    // Indexes for users
    await usersCollection.createIndex({ userId: 1 }, { unique: true });
    await usersCollection.createIndex({ username: 1 }, { unique: true });
    await usersCollection.createIndex({ role: 1 });
    await usersCollection.createIndex({ isActive: 1 });

    // === 3. AUDIT LOGS COLLECTION ===
    const auditLogsCollection = db.collection("auditLogs");

    // Optional: Seed some example logs
    const seedAuditLogs = [
      {
        timestamp: new Date(),
        userId: "U-001",
        username: "admin@junction.com",
        action: "login",
        status: "success",
        ip: "192.168.1.100",
        userAgent: "Mozilla/5.0...",
        details: "Admin login from headquarters",
      },
      {
        timestamp: new Date(Date.now() - 3600000),
        userId: "U-002",
        username: "agent@junction.com",
        action: "query",
        queryType: "drone_status",
        target: "DS-001",
        status: "allowed",
        details: "Retrieved active drone info",
        ip: "203.0.113.45",
      },
      {
        timestamp: new Date(Date.now() - 7200000),
        userId: null,
        username: "anonymous",
        action: "query",
        queryText: "Show me all active drones",
        status: "disallowed",
        reason: "unauthorized",
        ip: "102.168.5.200",
        details: "No authentication provided",
      },
    ];

    const logCount = await auditLogsCollection.countDocuments();
    if (logCount === 0) {
      const result = await auditLogsCollection.insertMany(seedAuditLogs);
      console.log(` Inserted ${result.insertedCount} audit log records`);
    } else {
      console.log(
        ` Skipped seeding audit logs: ${logCount} records already exist`,
      );
    }

    // Indexes for audit logs (critical for search & compliance)
    await auditLogsCollection.createIndex({ timestamp: -1 }); // Recent first
    await auditLogsCollection.createIndex({ userId: 1 });
    await auditLogsCollection.createIndex({ action: 1 });
    await auditLogsCollection.createIndex({ status: 1 });
    await auditLogsCollection.createIndex({ ip: 1 });
    await auditLogsCollection.createIndex({ target: 1 });

    // === FINAL STATS ===
    console.log("\n📈 Final Collection Counts:");
    console.log(`   drone-data : ${await dronesCollection.countDocuments()}`);
    console.log(`   users      : ${await usersCollection.countDocuments()}`);
    console.log(
      `   auditLogs  : ${await auditLogsCollection.countDocuments()}`,
    );

    // === SAMPLE QUERIES ===
    console.log("\n🔍 Sample Queries That Should Work Now:");

    const activeDrones = await dronesCollection.countDocuments({
      status: "Active",
    });
    console.log(`   Active drones: ${activeDrones}`);

    const totalAgents = await usersCollection.countDocuments({ role: "agent" });
    console.log(`   Field agents: ${totalAgents}`);

    const failedAttempts = await auditLogsCollection.countDocuments({
      action: "query",
      status: "disallowed",
    });
    console.log(`   Disallowed queries: ${failedAttempts}`);

    const recentLogs = await auditLogsCollection
      .find({})
      .sort({ timestamp: -1 })
      .limit(2)
      .toArray();
    console.log(`   Latest audit entries: ${recentLogs.length}`);
  } catch (error) {
    console.error(" Database setup error:", error);
    throw error;
  } finally {
    await client.close();
    console.log("🔌 Database connection closed");
  }
}

// Run the setup
setupDatabase().catch(console.error);
