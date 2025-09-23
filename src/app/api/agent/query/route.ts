import { NextResponse } from "next/server";
import * as auditLogger from "../../../lib/auditlogger";
import { auth0 } from "@/app/lib/auth0";
import { MongoClient } from "mongodb";

interface UserDoc {
  _id?: string;
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
  lastLogin: Date;
}

let mongoClient: MongoClient | null = null;

async function connectToMongo() {
  if (mongoClient) {
    return mongoClient;
  }
  const { MongoClient } = await import("mongodb");
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is not defined");

  mongoClient = new MongoClient(uri);
  await mongoClient.connect();
  return mongoClient;
}

export async function POST(request: Request) {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  let userId: string | null = null;
  let userInput: string | undefined = undefined;

  const userAgent = request.headers.get("user-agent") || "unknown";
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  try {
    const auth0User = await auth0.getSession();
    userId = auth0User?.user?.sub || null; // ✅ Assign userId here
    console.log(userId);

    if (userId) {
      console.log("started user upsert");
      const client = await connectToMongo();
      const db = client.db("junction-boxers");
      const usersCollection = db.collection("users");

      const userDoc = {
        sub: userId,
        email: auth0User?.user?.email as string | undefined,
        name: auth0User?.user?.name as string | undefined,
        picture: auth0User?.user?.picture as string | undefined,
        lastLogin: new Date(),
      };
      console.log("Upserting user document:", userDoc);

      await usersCollection.updateOne(
        { sub: userId },
        { $set: userDoc, $setOnInsert: { createdAt: new Date() } },
        { upsert: true },
      );
      console.log("User document upserted successfully.");
    }

    const body = await request.json();
    userInput = body.user_input;

    if (!userInput) {
      await auditLogger.logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: "error",
        error: "user_input is required",
        processingTime: Date.now() - startTime.getTime(),
      });
      return NextResponse.json(
        { status: "error", message: "user_input is required", auditId },
        { status: 400 },
      );
    }

    // ✅ Step 1: Call Agent 1 and pass the userId in the body
    const agent1Res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agent/1`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input: userInput, userId: userId }),
      },
    );

    if (!agent1Res.ok) {
      await auditLogger.logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: "error",
        error: `Agent 1 responded with ${agent1Res.status}`,
        processingTime: Date.now() - startTime.getTime(),
      });
      return NextResponse.json(
        { status: "error", message: "Agent 1 processing failed", auditId },
        { status: agent1Res.status },
      );
    }

    const agent1Result = await agent1Res.json();

    if (agent1Result.status === "disallowed") {
      await auditLogger.logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: "disallowed",
        agent1Result,
        finalResponse: agent1Result.reason,
        processingTime: Date.now() - startTime.getTime(),
      });
      return NextResponse.json(
        { status: "error", message: agent1Result.reason, auditId },
        { status: 403 },
      );
    }

    // Step 2: Call Agent 2
    const agent2Res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agent/2`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent1Result),
      },
    );

    if (!agent2Res.ok) {
      await auditLogger.logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: "error",
        agent1Result,
        error: `Agent 2 responded with ${agent2Res.status}`,
        processingTime: Date.now() - startTime.getTime(),
      });
      return NextResponse.json(
        { status: "error", message: "Agent 2 processing failed", auditId },
        { status: agent2Res.status },
      );
    }

    const agent2Result = await agent2Res.json();

    await auditLogger.logAudit({
      auditId,
      userId,
      userAgent,
      ipAddress,
      startTime,
      endTime: new Date(),
      userInput,
      queryStatus: "allowed",
      agent1Result,
      agent2Result,
      finalResponse: agent2Result.finalResponse,
      transparency: agent2Result.transparency,
      processingTime: Date.now() - startTime.getTime(),
    });
    return NextResponse.json({
      status: "success",
      message: agent2Result.finalResponse,
      transparency: agent2Result.transparency,
      auditId,
    });
  } catch (error: unknown) {
    console.error("Integration endpoint error:", error);
    await auditLogger.logAudit({
      auditId,
      userId,
      userAgent,
      ipAddress,
      startTime,
      endTime: new Date(),
      userInput,
      queryStatus: "error",
      error: error instanceof Error ? error.message : String(error),
      processingTime: Date.now() - startTime.getTime(),
    });
    return NextResponse.json(
      { status: "error", message: "Internal server error", auditId },
      { status: 500 },
    );
  }
}
