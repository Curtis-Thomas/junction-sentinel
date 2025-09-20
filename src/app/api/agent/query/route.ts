// Main integration endpoint for agent workflow
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { user_input } = await request.json();

    if (!user_input) {
      return NextResponse.json(
        { status: "error", message: "user_input is required" },
        { status: 400 },
      );
    }

    // Step 1: Call Agent 1 for privacy/compliance check and query generation
    const agent1Res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agent/1`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_input }),
      },
    );

    if (!agent1Res.ok) {
      return NextResponse.json(
        { status: "error", message: "Agent 1 processing failed" },
        { status: agent1Res.status },
      );
    }

    const agent1Result = await agent1Res.json();
    console.log("Agent 1 result:", agent1Result);

    // Check if Agent 1 disallowed the query
    if (agent1Result.status === "disallowed") {
      return NextResponse.json(
        { status: "error", message: agent1Result.reason },
        { status: 403 },
      );
    }

    // Step 2: Call Agent 2 with the result from Agent 1
    const agent2Res = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/agent/2`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(agent1Result),
      },
    );

    if (!agent2Res.ok) {
      return NextResponse.json(
        { status: "error", message: "Agent 2 processing failed" },
        { status: agent2Res.status },
      );
    }

    const agent2Result = await agent2Res.json();
    console.log("Agent 2 result:", agent2Result);

    // Return the final result from Agent 2
    return NextResponse.json({
      status: "success",
      message: agent2Result.finalResponse,
      transparency: agent2Result.transparency,
    });
  } catch (error) {
    console.error("Integration endpoint error:", error);
    return NextResponse.json(
      { status: "error", message: "Internal server error" },
      { status: 500 },
    );
  }
}
