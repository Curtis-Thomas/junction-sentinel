import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";
import { MongoClient } from "mongodb";

interface UserSettings {
  userId: string;
  highRiskPII: string[];
  allowedFields: string[];
  isAllowedQueries: string[];
  updatedAt: Date;
  createdAt: Date;
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

export async function GET() {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    if (!session || !session.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub as string;

    // Connect to MongoDB
    const client = await connectToMongo();
    const db = client.db("junction-boxers");
    const settingsCollection = db.collection("userSettings");

    // Get user settings
    const settings = await settingsCollection.findOne({ userId });

    if (!settings) {
      // Return default settings if none exist
      const defaultSettings: UserSettings = {
        userId,
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
        updatedAt: new Date(),
        createdAt: new Date(),
      };

      return NextResponse.json({ settings: defaultSettings });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Failed to fetch user settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch user settings" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    // Get Auth0 session
    const session = await auth0.getSession();
    if (!session || !session.user?.sub) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.sub as string;

    // Parse request body
    const body = await request.json();
    const { highRiskPII, allowedFields, isAllowedQueries } = body;

    // Validate input
    if (
      !Array.isArray(highRiskPII) ||
      !Array.isArray(allowedFields) ||
      !Array.isArray(isAllowedQueries)
    ) {
      return NextResponse.json(
        { error: "All fields must be arrays" },
        { status: 400 },
      );
    }

    // Connect to MongoDB
    const client = await connectToMongo();
    const db = client.db("junction-boxers");
    const settingsCollection = db.collection("userSettings");

    // Update or create user settings
    const updateData = {
      userId,
      highRiskPII,
      allowedFields,
      isAllowedQueries,
      updatedAt: new Date(),
    };

    const result = await settingsCollection.updateOne(
      { userId },
      {
        $set: updateData,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      updated: result.modifiedCount > 0,
      created: result.upsertedCount > 0,
    });
  } catch (error) {
    console.error("Failed to update user settings:", error);
    return NextResponse.json(
      { error: "Failed to update user settings" },
      { status: 500 },
    );
  }
}
