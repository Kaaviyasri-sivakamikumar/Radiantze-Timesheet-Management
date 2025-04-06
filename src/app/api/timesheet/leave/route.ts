import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getStorage } from "firebase-admin/storage";
import { v4 as uuidv4 } from "uuid";
import {
  validateWeekStartDate,
  validateYearAndMonth,
} from "@/lib/timesheet/utils";
import { getFirestore, FieldValue, DocumentSnapshot } from "firebase-admin/firestore";

const db = getFirestore(); 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const entityType = searchParams.get("type"); // e.g., "vendor", "client", "visa"
  const entityId = searchParams.get("id");


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

    let decodedToken;
    try {
      // Verify the token
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 403 }
      );
    }

    let employeeId: string | undefined;
    let isAdmin: boolean | undefined;
    let updatedBy: string;

    try {
      const tokenUser = await adminAuth.getUser(decodedToken.uid);
      employeeId = tokenUser.customClaims?.employeeId as string | undefined; // Explicitly cast to string | undefined
      isAdmin = tokenUser.customClaims?.isAdmin as boolean | false;
      updatedBy = tokenUser.displayName || tokenUser.email || "Unknown User";
    } catch (error) {
      console.error("Error getting employeeId:", error);
      return NextResponse.json(
        { message: "Invalid or expired token. EmployeeId not found" },
        { status: 403 }
      );
    }

    if (!employeeId || employeeId.trim() === "") {
      return NextResponse.json(
        { message: "Employee ID is missing or invalid" },
        { status: 400 }
      );
    }

    

    return NextResponse.json({
      success: true,
      message: "Remaining Leave calculated successfully.",
      entity: await calculateLeaveRemaining(employeeId),
    });

    
  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      {
        message: "Internal server error. Try again later.",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

async function calculateLeaveRemaining(employeeId: string) {
  return 3;
}

