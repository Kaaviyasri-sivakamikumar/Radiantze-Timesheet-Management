import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";

export async function POST(request: Request) {
  try {
    // Get the authorization token
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    try {
      // Verify the token
      const decodedToken = await adminAuth.verifyIdToken(token);

      // Get employee data from request body
      const employeeData = await request.json();

      // Initialize Firestore
      const db = getFirestore();

      // Add the document to Firestore with additional metadata
      const docRef = await db.collection("employees").add({
        ...employeeData,
        createdBy: decodedToken.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      return NextResponse.json({
        success: true,
        id: docRef.id,
        message: "Employee saved successfully",
      });
    } catch (error: any) {
      console.error("Error saving employee:", error);
      return NextResponse.json(
        { message: "Invalid authentication token" },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error("Server error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
