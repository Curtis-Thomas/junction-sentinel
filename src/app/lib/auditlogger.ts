// src/lib/auditLogger.ts
import { MongoClient } from "mongodb";
import { config } from "@/config";

interface AuditLog {
  logId: string;
  timestamp: Date;
  endTime: Date;
  userId?: string | null;
  userAgent: string;
  ipAddress: string;
  inputQuery?: string;
  queryStatus: "allowed" | "disallowed" | "error";
  agent1Decision?: string;
  agent1Reason?: string;
  agent2Response?: string;
  finalResponse?: string;
  transparency?: object;
  processingTimeMs: number;
  error?: string | null;
  metadata: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}

let cachedClient: MongoClient | null = null;

async function connectToDatabase(): Promise<MongoClient> {
  if (cachedClient) {
    try {
      await cachedClient.connect();
      return cachedClient;
    } catch (error) {
      console.error(
        "⚠️ Cached MongoDB client failed, creating new one:",
        error,
      );
    }
  }

  const uri = config.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  console.log("✅ Reused or created new MongoDB client for audit");
  return cachedClient;
}

export async function logAudit(auditData: {
  auditId: string;
  userId?: string | null;
  userAgent: string;
  ipAddress: string;
  startTime: Date;
  endTime: Date;
  userInput?: string;
  queryStatus: "allowed" | "disallowed" | "error";
  agent1Result?: { status?: string; reason?: string };
  agent2Result?: { finalResponse?: string };
  finalResponse?: string;
  transparency?: object;
  error?: string;
  processingTime: number;
}) {
  console.log("🔍 Starting audit log for:", auditData.auditId);

  let client: MongoClient;

  try {
    client = await connectToDatabase();
    const db = client.db("junction-boxers");
    const collection = db.collection<AuditLog>("auditLogs");

    const log: AuditLog = {
      logId: auditData.auditId,
      timestamp: auditData.startTime,
      endTime: auditData.endTime,
      userId: auditData.userId,
      userAgent: auditData.userAgent,
      ipAddress: auditData.ipAddress,
      inputQuery: auditData.userInput,
      queryStatus: auditData.queryStatus,
      agent1Decision: auditData.agent1Result?.status,
      agent1Reason: auditData.agent1Result?.reason,
      agent2Response: auditData.agent2Result?.finalResponse,
      finalResponse: auditData.finalResponse,
      transparency: auditData.transparency,
      processingTimeMs: auditData.processingTime,
      error: auditData.error || null,
      metadata: {
        requestId: auditData.auditId,
        timestamp: auditData.startTime.toISOString(),
        version: "1.0",
      },
    };

    console.log("📝 Inserting audit log:", JSON.stringify(log, null, 2));
    const result = await collection.insertOne(log);
    console.log(
      `✅ Audit logged: ${log.logId}, insertedId: ${result.insertedId}`,
    );
  } catch (error) {
    console.error("❌ Failed to log audit:", error);
  }
}
