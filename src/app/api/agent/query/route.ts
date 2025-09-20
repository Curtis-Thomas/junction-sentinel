// Main integration endpoint for agent workflow
import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

// Define TypeScript interfaces
interface AuditLog {
  logId: string;
  timestamp: Date;
  endTime: Date;
  userId?: string | null;
  userAgent: string;
  ipAddress: string;
  inputQuery?: string;
  queryStatus: 'allowed' | 'disallowed' | 'error';
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
      // Attempt to connect to the cached client.
      // The .connect() method is idempotent: if already connected, it's a no-op.
      // If the connection is stale or dropped, it will attempt to re-establish it.
      await cachedClient.connect();
      return cachedClient; // If connection is successful or re-established, reuse it.
    } catch (error) {
      // If connecting to the cached client fails, it's likely no longer usable.
      // Log the error and proceed to create a new client.
      console.error('⚠️ Cached MongoDB client failed to connect, creating a new one:', error);
      // The code outside this selection will handle creating a new MongoClient.
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not defined');

  cachedClient = new MongoClient(uri);
  await cachedClient.connect();
  console.log('✅ Reused or created new MongoDB client for audit');
  return cachedClient;
}

async function logAudit(auditData: {
  auditId: string;
  userId?: string | null;
  userAgent: string;
  ipAddress: string;
  startTime: Date;
  endTime: Date;
  userInput?: string;
  queryStatus: 'allowed' | 'disallowed' | 'error';
  agent1Result?: { status?: string; reason?: string; };
  agent2Result?: { finalResponse?: string; };
  finalResponse?: string;
  transparency?: object;
  error?: string;
  processingTime: number;
}) {
  console.log('🔍 Starting audit log for:', auditData.auditId);

  let client: MongoClient;

  try {
    client = await connectToDatabase();
    const db = client.db('junction-boxers');
    const auditLogs = db.collection('auditLogs');

    const auditLog: AuditLog = {
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
        version: '1.0',
      },
    };

    console.log('📝 Inserting audit log:', JSON.stringify(auditLog, null, 2));
    const result = await auditLogs.insertOne(auditLog);
    console.log(`✅ Audit logged successfully: ${auditData.auditId}, insertedId: ${result.insertedId}`);
  } catch (error: unknown) { // Changed 'any' to 'unknown' to fix lint warning
    console.error('❌ Failed to log audit:', error);
    // Don't rethrow — we don't want audit failure to crash the main response
  }
  // Do NOT close the client here if using pooling/reuse
}
//console.log('🚀 Starting request with auditId:', auditId);
export async function POST(request: Request) {
  const auditId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = new Date();
  let userId: string | null = null;
  let userInput: string | undefined = undefined; // Track it outside try-catch

  const userAgent = request.headers.get('user-agent') || 'unknown';
  const ipAddress =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  try {
    const body = await request.json();
    userInput = body.user_input;
    userId = body.user_id ?? null;

    if (!userInput) {
      const errorAudit = {
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: 'error' as const,
        error: 'user_input is required',
        processingTime: Date.now() - startTime.getTime(),
      };
      await logAudit(errorAudit);

      return NextResponse.json(
        { status: 'error', message: 'user_input is required', auditId },
        { status: 400 }
      );
    }

    // Step 1: Call Agent 1 for privacy/compliance check and query generation
    const agent1Res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/agent/1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_input: userInput }),
    });

    if (!agent1Res.ok) {
      await logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: 'error',
        error: `Agent 1 responded with ${agent1Res.status}`,
        processingTime: Date.now() - startTime.getTime(),
      });

      return NextResponse.json(
        { status: 'error', message: 'Agent 1 processing failed', auditId },
        { status: agent1Res.status }
      );
    }

    const agent1Result = await agent1Res.json();
    console.log('Agent 1 result:', agent1Result);

    // Check if Agent 1 disallowed the query
    if (agent1Result.status === 'disallowed') {
      await logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: 'disallowed',
        agent1Result,
        finalResponse: agent1Result.reason,
        processingTime: Date.now() - startTime.getTime(),
      });

      return NextResponse.json(
        { status: 'error', message: agent1Result.reason, auditId },
        { status: 403 }
      );
    }

    // Step 2: Call Agent 2 with the sanitized query from Agent 1
    const agent2Res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/agent/2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(agent1Result),
    });

    if (!agent2Res.ok) {
      await logAudit({
        auditId,
        userId,
        userAgent,
        ipAddress,
        startTime,
        endTime: new Date(),
        userInput,
        queryStatus: 'error',
        agent1Result,
        error: `Agent 2 responded with ${agent2Res.status}`,
        processingTime: Date.now() - startTime.getTime(),
      });

      return NextResponse.json(
        { status: 'error', message: 'Agent 2 processing failed', auditId },
        { status: agent2Res.status }
      );
    }

    const agent2Result = await agent2Res.json();
    console.log('🔍 Agent 2 raw result:', JSON.stringify(agent2Result, null, 2)); // ← Add this!
    // Log successful audit
    await logAudit({
      auditId,
      userId,
      userAgent,
      ipAddress,
      startTime,
      endTime: new Date(),
      userInput,
      queryStatus: 'allowed',
      agent1Result,
      agent2Result,
      finalResponse: agent2Result.finalResponse,
      transparency: agent2Result.transparency,
      processingTime: Date.now() - startTime.getTime(),
    });

    return NextResponse.json({
      status: 'success',
      message: agent2Result.finalResponse,
      transparency: agent2Result.transparency,
      auditId,
    });
  } catch (error: any) {
    console.error('Integration endpoint error:', error);

    // Safely log even when unexpected error occurs
    await logAudit({
      auditId,
      userId,
      userAgent,
      ipAddress,
      startTime,
      endTime: new Date(),
      userInput, // now safe because captured earlier
      queryStatus: 'error',
      error: error.message || 'Unknown internal error',
      processingTime: Date.now() - startTime.getTime(),
    });

    return NextResponse.json(
      { status: 'error', message: 'Internal server error', auditId },
      { status: 500 }
    );
  }
}