import { handleAuth } from "@auth0/nextjs-auth0";
export default handleAuth();

import { NextResponse } from "next/server";
import { auth0 } from "@/app/lib/auth0";

export async function GET() {
  try {
    const session = await auth0.getSession();
    
    if (!session || !session.user?.sub) {
      return NextResponse.json(
        { 
          authenticated: false, 
          message: "No Auth0 session found",
          subId: null 
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      subId: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      message: "Auth0 session found successfully"
    });

  } catch (error) {
    console.error("Auth0 test error:", error);
    return NextResponse.json(
      { 
        authenticated: false, 
        error: "Failed to get Auth0 session",
        subId: null 
      },
      { status: 500 }
    );
  }
}
