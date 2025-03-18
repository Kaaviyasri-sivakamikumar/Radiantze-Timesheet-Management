import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
const crypto = require("crypto");



export async function PUT(request: Request) {
  try {
    console.log("Updating....");
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

    let tokenUser;
    try {
      tokenUser = await adminAuth.getUser(decodedToken.uid);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      return NextResponse.json(
        { message: "Error retrieving admin user details." },
        { status: 500 }
      );
    }

    const updatedBy = tokenUser.displayName || tokenUser.email || "Unknown User";
    const employeeData = await request.json();

    if (!employeeData.email || !employeeData.firstName || !employeeData.lastName) {
      return NextResponse.json(
        { message: "Missing required employee fields" },
        { status: 400 }
      );
    }

    const db = getFirestore();

    try {
      const result = await db.runTransaction(async (transaction) => {
       
      
        const customClaims = {
          role: 'employee',
          employeeId: employeeData.employeeId,
          displayName: `${employeeData.firstName} ${employeeData.lastName}`,
          isAdmin: employeeData.isAdminUser || false 
        };

        

        await adminAuth.setCustomUserClaims(employeeData.authUid, customClaims);
        console.log("Claims updated to user",customClaims);



        const employeeRef = db.collection("employees").doc(employeeData.employeeId.toString());
        transaction.update(employeeRef, {
          ...employeeData,
          updatedAt: FieldValue.serverTimestamp(),
        });

        const logRef = employeeRef.collection("activity_logs").doc();
        transaction.set(logRef, {
          timestamp: FieldValue.serverTimestamp(),
          activity: "Employee updated",
          performedBy: updatedBy,
        });

        return {
          employeeId: employeeData.employeeId
        };
      });

      return NextResponse.json({
        success: true,
        employeeId: result.employeeId,
        message: "Employee updated successfully.",
      });
    } catch (error: any) {
      console.error("Error updating employee to Firestore:", error);
      return NextResponse.json(
        { message: "Error saving updating to database.", error: error.message },
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
