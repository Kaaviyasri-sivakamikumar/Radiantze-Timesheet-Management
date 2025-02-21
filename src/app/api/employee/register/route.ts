import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
const crypto = require("crypto");


function generatePassword(length: number = 8): string {
  const specialChars: string = "!@#$%^&*()_+{}[]|:;<>,.?/~";
  let password: string = "";

  // Ensure at least one special character
  password += specialChars[Math.floor(Math.random() * specialChars.length)];

  // Fill the rest of the password with random bytes
  password += crypto.randomBytes(length - 1).toString("base64").replace(/[^a-zA-Z0-9]/g, "").slice(0, length - 1);

  return password;
}

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

    const createdBy = adminUser.displayName || adminUser.email || "Unknown User";
    const employeeData = await request.json();

    if (!employeeData.email || !employeeData.firstName || !employeeData.lastName) {
      return NextResponse.json(
        { message: "Missing required employee fields" },
        { status: 400 }
      );
    }

    try {
      await adminAuth.getUserByEmail(employeeData.email);
      return NextResponse.json(
        { message: "Email already exists in records. Try with a different email." },
        { status: 400 }
      );
    } catch (error: any) {
      if (error.code !== "auth/user-not-found") {
        console.error("Error checking existing email:", error);
        return NextResponse.json(
          { message: "Error checking existing user.", error: error.message },
          { status: 500 }
        );
      }
    }

    const db = getFirestore();
    const counterRef = db.collection("config").doc("employeeCounter");

    try {
      const result = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        let lastEmployeeId = 1000;

        if (!counterDoc.exists) {
          transaction.set(counterRef, { lastEmployeeId });
        } else {
          lastEmployeeId = counterDoc.data()?.lastEmployeeId || Math.floor(Date.now() / 1000);
        }

        const newEmployeeId = "RAD"+(lastEmployeeId + 1);
        transaction.update(counterRef, { lastEmployeeId: (lastEmployeeId+1) });


        const customClaims = {
          role: 'employee',
          employeeId: newEmployeeId,
          isAdmin: employeeData.isAdminUser || false 
        };

        
        const randomPassword = generatePassword(10);
        const newUser = await adminAuth.createUser({
          email: employeeData.email,
          password: randomPassword,
          displayName: `${employeeData.firstName} ${employeeData.lastName}`,
          emailVerified: false,
          disabled: false,
        });

        await adminAuth.setCustomUserClaims(newUser.uid, customClaims);
        console.log("Claims added to user");



        const employeeRef = db.collection("employees").doc(newEmployeeId.toString());
        transaction.set(employeeRef, {
          ...employeeData,
          employeeId: newEmployeeId,
          authUid: newUser.uid,
          createdBy: createdBy,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          forceResetPassword: true,
        });

        const logRef = employeeRef.collection("activity_logs").doc();
        transaction.set(logRef, {
          timestamp: FieldValue.serverTimestamp(),
          activity: "Employee Created & Auth User Added",
          performedBy: createdBy,
        });

        return {
          employeeId: newEmployeeId,
          email: employeeData.email,
          tempPassword: randomPassword,
        };
      });

      return NextResponse.json({
        success: true,
        id: result.employeeId,
        email: result.email,
        message: "Employee created successfully. Temporary password generated.",
      });
    } catch (error: any) {
      console.error("Error saving employee to Firestore:", error);
      return NextResponse.json(
        { message: "Error saving employee to database.", error: error.message },
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


