// src/app/api/auth/verify/route.ts
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];
    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    console.log(userRecord.customClaims);
    return NextResponse.json({
      success: true,
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || "",
        isAdmin: userRecord.customClaims?.isAdmin || false,
      },
    });
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Token verification failed",
      },
      { status: 401 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { message: "Token is required" },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(token);
    const userRecord = await adminAuth.getUser(decodedToken.uid);

    return NextResponse.json({
      user: {
        id: userRecord.uid,
        email: userRecord.email,
        name: userRecord.displayName || "",
      },
      token,
    });
  } catch (error: any) {
    console.error("Token verification failed:", error);
    return NextResponse.json(
      { message: "Token verification failed" },
      { status: 401 }
    );
  }
}
