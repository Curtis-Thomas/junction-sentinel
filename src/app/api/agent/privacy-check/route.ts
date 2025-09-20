// Simplified privacy & compliance middleware endpoint
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { query } = await request.json();
  // Example privacy/compliance check: block queries containing 'salary of John Smith'
  if (typeof query !== "string" || query.toLowerCase().includes("john smith")) {
    return NextResponse.json(
      {
        allowed: false,
        reason: "Disallowed query: personal information detected.",
      },
      { status: 403 },
    );
  }
  // Pass allowed queries
  return NextResponse.json({ allowed: true, sanitizedQuery: query });
}
