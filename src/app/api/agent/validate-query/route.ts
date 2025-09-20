// Simplified query validation/sanitization endpoint
import { NextResponse } from 'next/server';

const allowedFields = [
  'droneId', 'model', 'status', 'location', 'altitudeMeters', 'speedMps', 
  'owner', 'privacyLevel', 'batteryLevel', 'flightDuration', 'purpose',
  'average', 'count', 'total', 'active', 'inactive'
];

export async function POST(request: Request) {
  const { query } = await request.json();
  // Example: Only allow queries that mention allowed fields
  const isAllowed = allowedFields.some(field => query.toLowerCase().includes(field));
  if (!isAllowed) {
    return NextResponse.json({ valid: false, reason: 'Query structure not allowed.' }, { status: 400 });
  }
  // Example sanitization: remove dangerous characters
  const sanitized = query.replace(/[${};]/g, '');
  return NextResponse.json({ valid: true, sanitizedQuery: sanitized });
}
