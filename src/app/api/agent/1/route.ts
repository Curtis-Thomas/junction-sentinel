// src/app/api/agent/1/route.ts
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { MongoClient } from "mongodb";
import { config } from "@/config";
// --- Environment Variables & Constants ---
const GEMINI_API_KEY = config.GEMINI_API_KEY;
const MONGODB_URI = config.MONGODB_URI;

// Check for the API key to prevent runtime errors
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set.");
}
if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set.");
}

// Global MongoClient to reuse connections
let mongoClient: MongoClient | null = null;
async function connectToMongo() {
  if (mongoClient) {
    return mongoClient;
  }
  const { MongoClient } = await import("mongodb");
  mongoClient = new MongoClient(MONGODB_URI!);
  await mongoClient.connect();
  return mongoClient;
}

// ✅ Corrected getUserSettings to fetch directly from MongoDB
const getUserSettings = async (userId: string) => {
  console.log("Fetching user settings for userId:", userId);

  try {
    const client = await connectToMongo();
    const db = client.db("junction-boxers");
    const settingsCollection = db.collection("userSettings");

    const settings = await settingsCollection.findOne({ userId });

    if (settings) {
      return settings;
    }

    // Fallback to default settings if no user settings are found in the DB
    console.warn("No user settings found. Using default settings.");
    return {
      highRiskPII: [
        "pilot_name",
        "Licence_number",
        "Address",
        "credit_card",
        "bank_account",
        "passport",
      ],
      allowedFields: [
        "droneId",
        "model",
        "status",
        "location",
        "altitudeMeters",
        "speedMps",
        "owner",
        "privacyLevel",
        "batteryLevel",
        "flightDuration",
        "purpose",
      ],
      isAllowedQueries: [
        "drone status",
        "active drones",
        "battery level",
        "location",
        "flight duration",
      ],
    };
  } catch (error) {
    console.error("Error fetching user settings from DB:", error);
    // Return a safe, default set of settings on error
    return {
      highRiskPII: [
        "pilot_name",
        "Licence_number",
        "Address",
        "credit_card",
        "bank_account",
        "passport",
      ],
      allowedFields: [
        "droneId",
        "model",
        "status",
        "location",
        "altitudeMeters",
        "speedMps",
        "owner",
        "privacyLevel",
        "batteryLevel",
        "flightDuration",
        "purpose",
      ],
      isAllowedQueries: [
        "drone status",
        "active drones",
        "battery level",
        "location",
        "flight duration",
      ],
    };
  }
};

export async function POST(req: Request) {
  console.log("Agent 1: Received POST request.");
  try {
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const body = await req.json();
    console.log("Agent 1: Parsed request body:", body);

    const userInput = body.user_input;
    const userId = body.userId; // ✅ Extract the userId from the request body

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

    if (!userId) {
      console.error("Agent 1: 'userId' is missing from the request body.");
      return NextResponse.json(
        { message: "Unauthorized: User ID is required." },
        { status: 401 },
      );
    }

    // ✅ Call getUserSettings with the provided userId
    const userSettings = await getUserSettings(userId);
    console.log("Agent 1: Fetched user settings:", userSettings);

    const prompt = `
      You are Agent 1, a Privacy Gatekeeper for a secure multi-agent system. Your responsibility is to analyze a user's natural language query and decide whether it is safe to proceed, with a strong focus on protecting Personally Identifiable Information (PII).
      Your output must be a single JSON object.
      Here are the rules you must follow:
      1. **Strict PII Protection**: Treat the following as high-risk PII: ${userSettings.highRiskPII.join(", ")}.
      2. **Allowed Fields Only**: You may ONLY process queries related to these approved fields: ${userSettings.allowedFields.join(", ")}.
      3. **Disallowed Queries**: If the user's query directly asks for PII of a *specific individual*, you must set the "status" to "disallowed" and provide a clear "reason". For example: ${userSettings.isAllowedQueries.join(" | ")}.
      4. **Allowed Queries**: If the query is safe and relates to allowed fields, set the "status" to "allowed".
        a. **Aggregation Queries**: If the query can be answered with an aggregated value (e.g., average, count, sum), create an appropriate MongoDB aggregation query.
          * Use "$avg" for average queries.
          * Use "$count" for count queries.
          * Use "$sum" for sum queries.
        b. **Find Queries**: If the query is for specific or general information, create a MongoDB find query.
          * For specific queries: Use an appropriate identifier as find criteria.
          * For general queries: Use appropriate filters.
          * Always use a "projection" to exclude PII fields.
          * Ensure the projection includes only non-sensitive fields from the allowed list.
      4. **JSON Format**: Your response MUST be a JSON object with the following structure:
        * \`status\`: "allowed" or "disallowed"
        * \`reason\`: A brief, human-readable explanation for your decision.
        * \`query\`: (Only if status is "allowed") The MongoDB query object.
          * \`find\`: The find criteria.
          * \`aggregate\`: The aggregation stage.
          * \`projection\`: The projection for find queries.
      Example 1 (Disallowed - PII):
      User: "What is Alex Chen's email?"
      Output:
      \`\`\`json
      {
      "status": "disallowed",
      "reason": "The query asks for specific, private information (email) about an individual. This is not allowed to protect privacy."
      }
      \`\`\`
      Example 2 (Allowed - Specific Item Location):
      User: "What's the latitude and longitude of item X?"
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "Query for specific location data.",
      "query": {
        "find": { "itemId": "X" },
        "projection": { "_id": 0, "itemId": 1, "location": 1 }
      }
      }
      \`\`\`
      Example 3 (Allowed - Specific Item Details):
      User: "What is the battery level of item Y?"
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "Query for specific operational data.",
      "query": {
        "find": { "itemId": "Y" },
        "projection": { "_id": 0, "itemId": 1, "batteryLevel": 1, "status": 1 }
      }
      }
      \`\`\`
      Example 4 (Allowed - Aggregation):
      User: "What is the average battery level of active items?"
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "Aggregated data request.",
      "query": {
        "find": { "status": "Active" },
        "aggregate": { "$avg": "$batteryLevel" }
      }
      }
      \`\`\`
      Example 5 (Allowed - Count Query):
      User: "How many items are currently active?"
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "Count aggregation request.",
      "query": {
        "find": { "status": "Active" },
        "aggregate": { "$count": "activeItems" }
      }
      }
      \`\`\`
      Example 6 (Allowed - List Query):
      User: "List all models in the system."
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "General information request.",
      "query": {
        "find": {},
        "projection": { "_id": 0, "itemId": 1, "model": 1, "status": 1, "owner": 1 }
      }
      }
      \`\`\`
      Example 7 (Allowed - Status Filter):
      User: "Show me all inactive items."
      Output:
      \`\`\`json
      {
      "status": "allowed",
      "reason": "Filtered status request.",
      "query": {
        "find": { "status": "Inactive" },
        "projection": { "_id": 0, "itemId": 1, "model": 1, "status": 1, "owner": 1 }
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
