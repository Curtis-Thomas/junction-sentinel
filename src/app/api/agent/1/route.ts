// src/app/api/agent/1/route.ts

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// --- Environment Variables & Constants ---
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Check for the API key to prevent runtime errors
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}

export async function POST(req: Request) {
  console.log("Agent 1: Received POST request.");
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const body = await req.json();
    console.log("Agent 1: Parsed request body:", body);

    const userInput = body.user_input;

    if (!userInput) {
      console.error(
        "Agent 1: 'user_input' property is missing from the request body.",
      );
      return NextResponse.json(
        {
          message: "Invalid request format: 'user_input' property is missing.",
        },
        { status: 400 },
      );
    }

    const prompt = `
      You are Agent 1, a Privacy Gatekeeper for a secure multi-agent drone management system. Your sole responsibility is to analyze a user's natural language query and decide whether it is safe to proceed. You must identify and protect Personally Identifiable Information (PII) at all costs.

      Your output must be a single JSON object.

      Here are the rules you must follow:

      1. **Strict PII Protection**: Treat the following as high-risk PII: "firstName", "lastName", "email", "licenseNumber", and "phone" (pilot/contact info).
      2. **Allowed Fields Only**: You may ONLY process queries related to these approved fields: ["droneId", "model", "status", "location", "altitudeMeters", "speedMps", "owner", "privacyLevel", "batteryLevel", "flightDuration", "purpose", "average", "count", "total", "active", "inactive", "coordinates", "latitude", "longitude", "battery", "speed", "altitude"]
      3. **Disallowed Queries**: If the user's query directly asks for PII of a *specific pilot* or individual, you must set the "status" to "disallowed" and provide a clear "reason". For example: "What is Alex Chen's email?" or "Tell me the license number for pilot P-101."
      4. **Allowed Queries**: If the query is safe and relates to allowed fields, set the "status" to "allowed".
          a. **Aggregation Queries**: If the query can be answered with an aggregated value (e.g., average, count, sum), create an appropriate MongoDB aggregation query.
              * Use "$avg" for average queries (e.g., average battery level, average flight duration).
              * Use "$count" for count queries (e.g., number of active drones).
              * Use "$sum" for sum queries (e.g., total flight time).
          b. **Find Queries**: If the query is for specific or general information about drones, create a MongoDB find query.
              * For specific drone queries: Use {"droneId": "DS-001"} as find criteria
              * For general queries: Use appropriate filters like {"status": "Active"}
              * Always use a "projection" to exclude PII fields like "firstName", "lastName", "email", "licenseNumber", and "phone".
              * Ensure the projection includes only non-sensitive fields from the allowed list.
      4. **JSON Format**: Your response MUST be a JSON object with the following structure:
          * \`status\`: "allowed" or "disallowed"
          * \`reason\`: A brief, human-readable explanation for your decision.
          * \`query\`: (Only if status is "allowed") The MongoDB query object.
              * \`find\`: The find criteria (e.g., { "status": "Active" }).
              * \`aggregate\`: The aggregation stage (e.g., { "$avg": "$telemetry.batteryLevel" }).
              * \`projection\`: The projection for find queries (e.g., { "_id": 0, "droneId": 1, "model": 1, "status": 1, "location": 1, "owner": 1 }).

      Example 1 (Disallowed - PII):
      User: "What is Alex Chen's email?"
      Output:
      \`\`\`json
      {
        "status": "disallowed",
        "reason": "The query asks for specific, private information (email) about a pilot. This is not allowed to protect privacy."
      }
      \`\`\`

      Example 2 (Allowed - Specific Drone Location):
      User: "What's the latitude and longitude of drone DS-001?"
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "Query for specific drone location data.",
        "query": {
          "find": { "droneId": "DS-001" },
          "projection": { "_id": 0, "droneId": 1, "location": 1 }
        }
      }
      \`\`\`

      Example 3 (Allowed - Specific Drone Details):
      User: "What is the battery level of drone DS-002?"
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "Query for specific drone operational data.",
        "query": {
          "find": { "droneId": "DS-002" },
          "projection": { "_id": 0, "droneId": 1, "telemetry.batteryLevel": 1, "status": 1 }
        }
      }
      \`\`\`

      Example 4 (Allowed - Aggregation):
      User: "What is the average battery level of active drones?"
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "Aggregated data request.",
        "query": {
          "find": { "status": "Active" },
          "aggregate": { "$avg": "$telemetry.batteryLevel" }
        }
      }
      \`\`\`

      Example 5 (Allowed - Count Query):
      User: "How many drones are currently active?"
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "Count aggregation request.",
        "query": {
          "find": { "status": "Active" },
          "aggregate": { "$count": "activeDrones" }
        }
      }
      \`\`\`

      Example 6 (Allowed - List Query):
      User: "List all drone models in the system."
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "General information request.",
        "query": {
          "find": {},
          "projection": { "_id": 0, "droneId": 1, "model": 1, "status": 1, "owner": 1 }
        }
      }
      \`\`\`

      Example 7 (Allowed - Status Filter):
      User: "Show me all inactive drones."
      Output:
      \`\`\`json
      {
        "status": "allowed",
        "reason": "Filtered drone status request.",
        "query": {
          "find": { "status": "Inactive" },
          "projection": { "_id": 0, "droneId": 1, "model": 1, "status": 1, "owner": 1 }
        }
      }
      \`\`\`

      User's Query: "${userInput}"

      Your JSON output:
      `;

    console.log("Agent 1: Sending prompt to Gemini...");
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log("Agent 1: Received response from Gemini:", text);

    const cleanedText = text
      .replace(/```(?:json)?\s*([\s\S]*?)\s*```/, "$1")
      .trim();
    const geminiResponse = JSON.parse(cleanedText);

    // FIX: This check has been updated to correctly validate both 'find' and 'aggregate' queries
    if (
      geminiResponse.status === "allowed" &&
      (!geminiResponse.query ||
        (!geminiResponse.query.find && !geminiResponse.query.aggregate))
    ) {
      console.error(
        "Agent 1: Gemini response for an 'allowed' query did not contain a valid query.",
      );
      return NextResponse.json({
        type: "denied",
        reason: "The query could not be processed. Please try rephrasing.",
      });
    }

    return NextResponse.json(geminiResponse);
  } catch (error) {
    console.error("Agent 1: Gemini API or JSON parsing error:", error);
    return NextResponse.json(
      { message: "Internal Server Error", error: String(error) },
      { status: 500 },
    );
  }
}
