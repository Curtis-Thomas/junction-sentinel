// types/audit.ts
export interface AuditLog {
  logId: string;
  timestamp: string; // ISO string
  endTime: string;
  userId?: string | null;
  userAgent: string;
  ipAddress: string;
  inputQuery?: string;
  queryStatus: "allowed" | "disallowed" | "error";
  agent1Decision?: string;
  agent1Reason?: string;
  agent2Response?: string;
  finalResponse?: string;
  transparency?: Record<string, unknown>;
  processingTimeMs: number;
  error?: string | null;
  metadata: {
    requestId: string;
    timestamp: string;
    version: string;
  };
}
