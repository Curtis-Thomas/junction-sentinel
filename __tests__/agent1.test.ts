/**
 * @jest-environment node
 */
import { POST } from "../src/app/api/agent/1/route";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the entire @google/generative-ai module
jest.mock("@google/generative-ai");

describe("Agent 1 API Route", () => {
  const mockGeminiResponse = (jsonString: string) => {
    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => {
      return {
        getGenerativeModel: () => ({
          generateContent: async () => ({
            response: {
              text: () => jsonString,
            },
          }),
        }),
      };
    });
  };

  // Requirement: Privacy-Aware Query Handling (PII)
  test("Requirement: Privacy-Aware Query Handling (PII)", async () => {
    // Test Case: User asks for specific personal information
    const userInput = "What is the email of Alex Chen?";
    mockGeminiResponse(
      JSON.stringify({
        status: "disallowed",
        reason:
          "The query asks for specific, private information (email) about a pilot. This is not allowed to protect privacy.",
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("disallowed");
    expect(result.reason).toContain("email");
  });

  // Requirement: Rule-Based Data Access (Aggregation)
  test("Requirement: Rule-Based Data Access (Aggregation)", async () => {
    // Test Case: User asks for aggregated data like an average
    const userInput = "What is the average battery level of active drones?";
    mockGeminiResponse(
      JSON.stringify({
        status: "allowed",
        reason: "Aggregated data request.",
        query: {
          find: { status: "Active" },
          aggregate: { $avg: "$telemetry.batteryLevel" },
        },
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("allowed");
    expect(result.query.aggregate).toEqual({ $avg: "$telemetry.batteryLevel" });
  });

  // Requirement: Integration of LLMs with policy checks (non-sensitive query)
  test("Requirement: Integration of LLMs with policy checks (non-sensitive query)", async () => {
    // Test Case: User asks for a simple, non-sensitive list with projection
    const userInput = "List all active drones.";
    mockGeminiResponse(
      JSON.stringify({
        status: "allowed",
        reason: "General information request.",
        query: {
          find: { status: "Active" },
          projection: {
            _id: 0,
            droneId: 1,
            model: 1,
            status: 1,
            location: 1,
            owner: 1,
          },
        },
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("allowed");
    expect(result.query.find).toEqual({ status: "Active" });
    expect(result.query.projection).toEqual({
      _id: 0,
      droneId: 1,
      model: 1,
      status: 1,
      location: 1,
      owner: 1,
    });
  });

  // Requirement: Handle invalid or unprocessable queries gracefully
  test("Requirement: Handle invalid or unprocessable queries gracefully", async () => {
    // Test Case: Handle missing user input
    const mockRequest = { json: async () => ({}) } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(400);
    expect(result.message).toContain("user_input");
  });

  // --- NEW TEST CASES ---

  // Testing Privacy-Aware Query Handling (PII) with a different PII field
  test("New Test: Disallow query for pilot license number", async () => {
    const userInput = "Tell me the license number for pilot P-102.";
    mockGeminiResponse(
      JSON.stringify({
        status: "disallowed",
        reason:
          "The query asks for specific, private information (licenseNumber) about a pilot. This is not allowed to protect privacy.",
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("disallowed");
    expect(result.reason).toContain("licenseNumber");
  });

  // Testing Aggregation & Summarization with a count query
  test("New Test: Allow aggregation for a count of active drones", async () => {
    const userInput = "How many drones are active?";
    mockGeminiResponse(
      JSON.stringify({
        status: "allowed",
        reason: "Aggregated data request.",
        query: {
          find: { status: "Active" },
          aggregate: { $count: "activeDrones" },
        },
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("allowed");
    expect(result.query.find).toEqual({ status: "Active" });
    expect(result.query.aggregate).toEqual({ $count: "activeDrones" });
  });

  // Testing Complex Filtering & Rule-Based Access
  test("New Test: Allow find query with a complex filter and projection", async () => {
    const userInput =
      "List the drone IDs of all drones with a battery level below 50% that are inactive.";
    mockGeminiResponse(
      JSON.stringify({
        status: "allowed",
        reason: "General information request.",
        query: {
          find: { "telemetry.batteryLevel": { $lt: 50 }, status: "Inactive" },
          projection: { _id: 0, droneId: 1 },
        },
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("allowed");
    expect(result.query.find).toEqual({
      "telemetry.batteryLevel": { $lt: 50 },
      status: "Inactive",
    });
    expect(result.query.projection).toEqual({ _id: 0, droneId: 1 });
  });

  // Testing Edge Cases for invalid query format
  test("New Test: Handle allowed query without a valid find or aggregate key", async () => {
    const userInput = "Show me something weird.";
    mockGeminiResponse(
      JSON.stringify({
        status: "allowed",
        reason: "The AI could not form a valid query.",
        query: { find: {}, aggregate: {} },
      })
    );

    const mockRequest = {
      json: async () => ({ user_input: userInput }),
    } as unknown as Request;
    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.status).toBe("allowed");
    // This part of the test now correctly reflects the logic in the code
    expect(result.query.find).toEqual({});
  });
});
