// src/app/api/audit-logs/route.ts
import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { config } from "@/config";

export async function GET() {
  let client;
  try {
    const uri = config.MONGODB_URI;
    if (!uri) {
      return NextResponse.json(
        { error: "Database connection string not configured" },
        { status: 500 },
      );
    }

    client = new MongoClient(uri);
    await client.connect();

    const db = client.db("junction-boxers");
    const collection = db.collection("auditLogs");

    // Fetch latest 50 logs, sorted by newest first
    const logs = await collection
      .find({}, { projection: { _id: 0 } }) // Exclude MongoDB _id
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ logs }, { status: 200 });
  } catch (error) {
    console.error("❌ Failed to fetch audit logs:", error);
    return NextResponse.json(
      { error: "Failed to retrieve audit logs" },
      { status: 500 },
    );
  } finally {
    if (client) {
      await client.close();
    }
  }
}
