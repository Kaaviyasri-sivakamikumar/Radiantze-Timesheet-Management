import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
const crypto = require("crypto");



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

    let adminUser;
    try {
      adminUser = await adminAuth.getUser(decodedToken.uid);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      return NextResponse.json(
        { message: "Error retrieving admin user details." },
        { status: 500 }
      );
    }

    const updatedBy = adminUser.displayName || adminUser.email || "Unknown User";
    const accessData = await request.json();

    if (accessData.disableAccess==undefined || !accessData.authUid || !accessData.employeeId) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    try {
      const result = await db.runTransaction(async (transaction) => {
    
        const newUser = await adminAuth.updateUser(accessData.authUid,{
          disabled: accessData.disableAccess ? accessData.disableAccess : false,
        });
        console.log("Claims added to user");



        const employeeRef = db.collection("employees").doc(accessData.employeeId.toString());
        transaction.update(employeeRef, {
          accessDisabled: accessData.disableAccess ? accessData.disableAccess : false,
        });

        const logRef = employeeRef.collection("activity_logs").doc();
        transaction.set(logRef, {
          timestamp: FieldValue.serverTimestamp(),
          activity: accessData.disableAccess ? "Access is disabled" : "Access is enabled",
          performedBy: updatedBy,
        });

        return {
          employeeId: accessData.employeeId,
          disableAccess: accessData.disableAccess,
        };
      });

      return NextResponse.json({
        success: true,
        employeeId: result.employeeId,
        disableAccess: result.disableAccess,
        message: "Employee access successfully updated.",
      });
    } catch (error: any) {
      console.error("Error updating employee access to Firestore:", error);
      return NextResponse.json(
        { message: "Error updating employee access to Firestore.", error: error.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Internal server error:", error);
    return NextResponse.json(
      { message: "Internal server error. Try again later." },
      { status: 500 }
    );
  }
}


