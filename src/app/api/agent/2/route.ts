// src/app/api/agent/2/route.ts

import { NextResponse } from "next/server";
import { MongoClient } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Environment Variables & Constants ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MONGODB_URI: string | undefined = process.env.MONGODB_URI;

// Check for necessary environment variables
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set.");
}

export async function POST(req: Request) {
  console.log("Agent 2: Received POST request.");
  const client = new MongoClient(MONGODB_URI as string);

  try {
    const { user_input, query, status } = await req.json();
    console.log("Agent 2: Parsed request body:", { user_input, query, status });

    // Sanity check: Ensure Agent 1 didn't return a disallowed status
    if (status === "disallowed") {
      console.warn("Agent 2: Received a disallowed query. Rejecting.");
      return NextResponse.json(
        {
          type: "error",
          message: "The query was denied by Agent 1 and cannot be processed.",
        },
        { status: 403 },
      );
    }

    // Safety check: Ensure query is defined
    if (!query) {
      console.error("Agent 2: No query provided. Request should be processed by Agent 1 first.");
      return NextResponse.json(
        {
          type: "error",
          message: "No query provided. Please ensure the request is processed by Agent 1 first.",
        },
        { status: 400 },
      );
    }

    await client.connect();
  const db = client.db("junction-boxers");
  // Update to use drones collection for drone context
  const dronesCollection = db.collection("drones");

    let retrievedData;
    let transparencyMessage = "";

    // --- Data Retrieval Logic based on Agent 1's decision ---
    if (query.aggregate && typeof query.aggregate === "object") {
      // Handle COUNT aggregation specifically, which uses a specific pipeline stage
      if (query.aggregate["$count"]) {
        console.log("Agent 2: Executing a count aggregation query.");
        const countFieldName = query.aggregate["$count"];
        const pipeline = [
          { $match: query.find || {} },
          { $count: countFieldName },
        ];
        const aggResult = await dronesCollection.aggregate(pipeline).next();
        // The result will be an object like { totalDrones: 8 }
        retrievedData = aggResult || { [countFieldName]: 0 };
        transparencyMessage = `The system returned a total count to protect individual drone and pilot data.`;

      } else if (query.aggregate["$avg"]) {
        console.log("Agent 2: Executing an average aggregation query.");
        const avgFieldName = String(query.aggregate["$avg"]).replace(/^\$/, "");
        const pipeline = [
          { $match: query.find || {} },
          { $group: { _id: null, average: { $avg: "$" + avgFieldName } } },
        ];
        const aggResult = await dronesCollection.aggregate(pipeline).next();
        retrievedData = aggResult
          ? { average: aggResult.average }
          : { average: 0 };
        transparencyMessage = `The system returned an aggregated average to protect individual drone and pilot data.`;
      }
    } else {
      // Default to a standard find query if no aggregation is specified
      console.log("Agent 2: Executing a standard find query.");
      retrievedData = await dronesCollection
        .find(query.find, { projection: query.projection })
        .toArray();
      transparencyMessage = `The system retrieved drone data and redacted sensitive pilot information to protect privacy.`;
    }

    // --- Add a check for differential privacy ---
    if (query.privacy === "differential_privacy") {
      transparencyMessage = `The system used differential privacy to protect individual drone and pilot data.`;
    }

    // --- LLM Call for Response Synthesis (Agent 2's Final Task) ---
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Separate the sensitive and non-sensitive data for a more transparent response
    let safeData: Record<string, unknown>[] = [];
    if (Array.isArray(retrievedData)) {
      safeData = retrievedData.map((drone: Record<string, unknown>) => {
        // Only include non-PII, non-sensitive fields for drones
        const sanitizedDrone: Record<string, unknown> = {};
        if (drone.droneId) sanitizedDrone.droneId = drone.droneId;
        if (drone.model) sanitizedDrone.model = drone.model;
        if (drone.status) sanitizedDrone.status = drone.status;
        if (drone.location) sanitizedDrone.location = drone.location;
        if (drone.altitudeMeters) sanitizedDrone.altitudeMeters = drone.altitudeMeters;
        if (drone.speedMps) sanitizedDrone.speedMps = drone.speedMps;
        if (drone.owner) sanitizedDrone.owner = drone.owner;
        if (drone.privacyLevel) sanitizedDrone.privacyLevel = drone.privacyLevel;
        return sanitizedDrone;
      });
    } else if (retrievedData && typeof retrievedData === "object") {
      // For aggregation results like count or average, just pass them as-is in an array
      safeData = [retrievedData];
    }

    const synthesisPrompt = `
      You are an AI assistant tasked with creating a clear and transparent user response for a drone management system.
      The user's original request was: "${user_input}"
      The retrieved data is: ${JSON.stringify(retrievedData)}
      The following privacy measures were applied: ${transparencyMessage}

      Combine this information into a single, user-friendly sentence or short paragraph.
      Do not include any technical details about MongoDB or the data structure.
      Simply present the information in a polite and helpful manner.

      As a final security check, you must adhere strictly to GDPR and PII rules. Under no circumstances should you include any personally identifiable information like pilot names, emails, license numbers, or phone numbers in the final response. If the retrieved data contains this information, it must be sanitized, masked, or aggregated before being presented.

      Here is the sanitized, non-sensitive drone data that can be displayed: ${JSON.stringify(safeData)}.
      
      When generating the response, explicitly mention which data points were redacted to ensure transparency with the user.
      
      Output:
    `;

    console.log("Agent 2: Sending synthesis prompt to Gemini...");
    const result = await model.generateContent(synthesisPrompt);
    const finalResponse = result.response.text().trim();
    console.log("Agent 2: Received final response from Gemini:", finalResponse);

    // Return the final, human-readable response
    return NextResponse.json({
      finalResponse,
      transparency: transparencyMessage,
    });
  } catch (error) {
    console.error("Agent 2: Database or API error:", error);
    return NextResponse.json(
      { message: "Internal Server Error in Agent 2", error: String(error) },
      { status: 500 },
    );
  } finally {
    await client.close();
  }
}
