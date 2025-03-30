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

    const updatedBy =
      adminUser.displayName || adminUser.email || "Unknown User";
    const accessData = await request.json();

    if (
      accessData.disableAccess == undefined ||
      !accessData.authUid ||
      !accessData.employeeId
    ) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const employeeRef = db
      .collection("employees")
      .doc(accessData.employeeId.toString());
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return NextResponse.json(
        { message: "Employee not found." },
        { status: 404 }
      );
    }

    const employeeData = employeeDoc.data();

    // Prevent redundant updates
    if (employeeData?.accessDisabled === accessData.disableAccess) {
      const message = accessData.disableAccess
        ? "Account already disabled"
        : "Account already enabled";
      return NextResponse.json({ message }, { status: 400 });
    }

    if (
      accessData.disableAccess &&
      (
        employeeData?.startDate === undefined ||
        employeeData?.startDate === null ||
        employeeData?.startDate === "" ||
    
        employeeData?.endDate === undefined ||
        employeeData?.endDate === null ||
        employeeData?.endDate === "" ||
    
        employeeData?.designation === undefined ||
        employeeData?.designation === null ||
        employeeData?.designation === ""
      )
    ) {
      return NextResponse.json(
        {
          message: "Start date, end date, and designation are required for disabling the account.",
        },
        { status: 400 }
      );
    }
    

    try {
      const result = await db.runTransaction(async (transaction) => {
        // Update Firebase Auth user
        await adminAuth.updateUser(accessData.authUid, {
          disabled: accessData.disableAccess,
        });

        if (accessData.disableAccess) {
          const previousEmploymentEntry = {
            startDate: employeeData?.startDate || null,
            endDate: employeeData?.endDate || null,
            vendor: employeeData?.vendor || null,
            client: employeeData?.client || null,
            designation: employeeData?.designation || null,
            updatedAt: new Date(),
          };

          const previousEmploymentsArray =
            employeeData?.previousEmployments || [];

          previousEmploymentsArray.push(previousEmploymentEntry);
          console.log(previousEmploymentsArray);
          transaction.update(employeeRef, {
            accessDisabled: accessData.disableAccess,
            startDate: "",
            endDate: "",
            vendor: {},
            client: {},
            designation: "",
            previousEmployments: previousEmploymentsArray,
          });
        } else {
          transaction.update(employeeRef, {
            accessDisabled: accessData.disableAccess,
          });
        }

        // Update Firestore employee doc

        // Add activity log
        const logRef = employeeRef.collection("activity_logs").doc();
        transaction.set(logRef, {
          timestamp: FieldValue.serverTimestamp(),
          activity: accessData.disableAccess
            ? "Access is disabled"
            : "Access is enabled",
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
        {
          message: "Error updating employee access to Firestore.",
          error: error.message,
        },
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
