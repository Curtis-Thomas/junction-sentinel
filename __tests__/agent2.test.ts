/**
 * @jest-environment node
 */
import { POST } from "../src/app/api/agent/2/route";
import { MongoClient, MongoServerError } from "mongodb";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mock the entire mongodb and @google/generative-ai modules
jest.mock("mongodb");
jest.mock("@google/generative-ai");

describe("Agent 2 API Route", () => {
  let mockAggregate: jest.Mock;
  let mockFind: jest.Mock;
  let mockText: jest.Mock;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockCollection = {
      aggregate: jest.fn().mockReturnValue({ next: jest.fn() }),
      find: jest.fn(() => ({ toArray: jest.fn() })),
    };
    const mockDb = { collection: jest.fn(() => mockCollection) };
    mockClient = {
      connect: jest.fn(),
      close: jest.fn(),
      db: jest.fn(() => mockDb),
    };
    (MongoClient as unknown as jest.Mock).mockImplementation(() => mockClient);
    mockAggregate = mockCollection.aggregate().next as jest.Mock;
    mockFind = mockCollection.find().toArray as jest.Mock;

    const mockTextFunction = jest.fn();
    const mockGenerativeModel = {
      generateContent: jest.fn().mockResolvedValue({
        response: { text: mockTextFunction },
      }),
    };

    (GoogleGenerativeAI as jest.Mock).mockImplementation(() => ({
      getGenerativeModel: () => mockGenerativeModel,
    }));

    mockText = mockTextFunction;
  });

  // Requirement: Multi-Agent Flow (Denied by Agent 1)
  test("Requirement: Multi-Agent Flow (Denied by Agent 1)", async () => {
    const mockRequest = {
      json: async () => ({ status: "disallowed" }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(403);
    expect(result.message).toContain("denied by Agent 1");
    expect(mockClient.connect).not.toHaveBeenCalled();
  });

  // Requirement: Data Transformation & Transparency (Aggregation - Average)
  test("Requirement: Data Transformation & Transparency (Aggregation)", async () => {
    mockAggregate.mockResolvedValue({ average: 85.5 });
    mockText.mockReturnValue("The average battery level is 85.5%.");

    const mockRequest = {
      json: async () => ({
        user_input: "what is the average battery level of active drones?",
        query: {
          find: { status: "Active" },
          aggregate: { $avg: "$telemetry.batteryLevel" },
        },
        status: "allowed",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.finalResponse).toBe("The average battery level is 85.5%.");
    expect(result.transparency).toContain("aggregated average");
    expect(mockAggregate).toHaveBeenCalledTimes(1);
  });

  // Requirement: Data Transformation (Count & Summarization)
  test("Requirement: Data Transformation (Count & Summarization)", async () => {
    mockAggregate.mockResolvedValue({ activeDroneCount: 8 });
    mockText.mockReturnValue("There are 8 active drones in total.");

    const mockRequest = {
      json: async () => ({
        user_input: "how many drones are active?",
        query: {
          find: { status: "Active" },
          aggregate: { $count: "activeDroneCount" },
        },
        status: "allowed",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.finalResponse).toBe("There are 8 active drones in total.");
    expect(result.transparency).toContain(
      "total count to protect individual drone and pilot data.",
    );
  });

  // Requirement: Useful Insights Delivered (Find Query with Projection)
  test("Requirement: Useful Insights Delivered (Find Query)", async () => {
    const mockDrones = [
      {
        droneId: "DS-001",
        model: "Falcon 900",
        status: "Active",
        telemetry: { batteryLevel: 85 },
      },
      {
        droneId: "DS-003",
        model: "Phoenix",
        status: "Active",
        telemetry: { batteryLevel: 92 },
      },
    ];
    mockFind.mockResolvedValue(mockDrones);
    mockText.mockReturnValue(
      "The active drones are DS-001 (Falcon 900) and DS-003 (Phoenix). Sensitive pilot information was redacted to protect privacy.",
    );

    const mockRequest = {
      json: async () => ({
        user_input: "List all active drones.",
        query: {
          find: { status: "Active" },
          projection: {
            _id: 0,
            droneId: 1,
            model: 1,
            status: 1,
            "telemetry.batteryLevel": 1,
          },
        },
        status: "allowed",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.finalResponse).toContain(
      "The active drones are DS-001 (Falcon 900) and DS-003 (Phoenix).",
    );
    expect(result.transparency).toContain(
      "redacted sensitive pilot information",
    );
  });

  // Inspiration: Differential Privacy (Simulated)
  test("Inspiration: Differential Privacy (Simulated)", async () => {
    const mockRequest = {
      json: async () => ({
        user_input: "what is the average flight duration",
        query: {
          find: { status: "Active" },
          aggregate: { $avg: "$flightDuration" },
          privacy: "differential_privacy",
        },
        status: "allowed",
      }),
    } as unknown as Request;

    mockAggregate.mockResolvedValue({ average: 45.3 });
    mockText.mockReturnValue(
      "The average flight duration with differential privacy is 45.3 minutes.",
    );

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.finalResponse).toBe(
      "The average flight duration with differential privacy is 45.3 minutes.",
    );
    expect(result.transparency).toContain("differential privacy");
  });

  // NEW TEST CASE: Graceful handling of database errors
  test("New Test: Graceful handling of database errors", async () => {
    // Mock the database call to throw a specific MongoDB error
    const mongoError = new MongoServerError({
      message: "An invalid aggregate field was used.",
      code: 16982,
      codeName: "InvalidPipe",
    });
    mockAggregate.mockRejectedValue(mongoError);

    const mockRequest = {
      json: async () => ({
        user_input: "what is the average flight duration",
        query: {
          find: { status: "Active" },
          aggregate: { $avg: "$flightDuration" },
        },
        status: "allowed",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(500);
    expect(result.message).toContain("Internal Server Error in Agent 2");
    expect(result.error).toContain(
      "MongoServerError: An invalid aggregate field was used.",
    );
  });

  // NEW TEST CASE: Handle allowed query with no results
  test("New Test: Handle allowed query with no matching data", async () => {
    mockFind.mockResolvedValue([]);
    mockText.mockReturnValue(
      "No drones with a battery level below 5% were found. Sensitive pilot information was redacted to protect privacy.",
    );

    const mockRequest = {
      json: async () => ({
        user_input: "Show me drones with a battery level below 5%.",
        query: {
          find: { "telemetry.batteryLevel": { $lt: 5 } },
          projection: { _id: 0, droneId: 1, model: 1 },
        },
        status: "allowed",
      }),
    } as unknown as Request;

    const response = await POST(mockRequest);
    const result = await response.json();

    expect(response.status).toBe(200);
    expect(result.finalResponse).toContain(
      "No drones with a battery level below 5% were found.",
    );
  });
});
