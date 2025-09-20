// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { auth0 } from "./app/lib/auth0";

const rateLimit = (windowMs: number, max: number) => {
  const requestsMap: Record<string, { count: number; timestamp: number }> = {};

  return (req: NextRequest) => {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const currentTime = Date.now();

    if (!requestsMap[ip]) {
      requestsMap[ip] = { count: 1, timestamp: currentTime };
    } else {
      const elapsed = currentTime - requestsMap[ip].timestamp;

      if (elapsed < windowMs) {
        requestsMap[ip].count += 1;
        if (requestsMap[ip].count > max) {
          return NextResponse.json(
            { message: "Too many requests, please try again later." },
            { status: 429 },
          );
        }
      } else {
        requestsMap[ip] = { count: 1, timestamp: currentTime };
      }
    }
    return null;
  };
};

const apiLimiter = rateLimit(1 * 60 * 1000, 1000);

export async function middleware(request: NextRequest) {
  console.log(`Incoming request: ${request.method} ${request.url}`);

  // ** IMPORTANT FIX: Exclude the file upload route from middleware processing **
  if (request.nextUrl.pathname.startsWith("/api/upload-dicom")) {
    // Return a direct response here to let the request pass through
    // without the middleware consuming the body.
    return NextResponse.next();
  }

  // Now, the rest of your middleware logic can run for other routes
  const rateLimitResponse = apiLimiter(request);
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  const response = await auth0.middleware(request);

  response.headers.set(
    "Content-Security-Policy",
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
  );

  const contentType = response.headers.get("Content-Type");
  if (!contentType) {
    if (request.url.includes("/api/")) {
      response.headers.set("Content-Type", "application/json; charset=utf-8");
    } else {
      response.headers.set("Content-Type", "text/html; charset=utf-8");
    }
  }

  return response;
}

export const config = {
  matcher: [
    // This matcher is good, but the conditional check in the code is more flexible
    // for specific routes that need to be excluded.
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
