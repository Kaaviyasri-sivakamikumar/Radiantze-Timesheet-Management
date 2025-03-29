"use server";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
import { EntityType, getEntityDetailsFromDB } from "../../entity/route";
const crypto = require("crypto");

export type EmployeeData = {
  employeeId: string;
  client: string;
  designation: string;
  email: string;
  firstName: string;
  lastName: string;
  vendor: string;
  startDate: string;
};

export async function GET(request: Request) {
  try {
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

    let employeeId: string | undefined;
    try {
      const tokenUser = await adminAuth.getUser(decodedToken.uid);
      employeeId = tokenUser.customClaims?.employeeId as string | undefined;
    } catch (error) {
      console.error("Error getting employeeId:", error);
      return NextResponse.json(
        { message: "EmployeeId not found" },
        { status: 403 }
      );
    }

    if (!employeeId) {
      return NextResponse.json(
        { message: "Invalid Employee ID" },
        { status: 400 }
      );
    }

    const db = getFirestore();
    const employeeRef = db.collection("employees").doc(employeeId);
    const employeeDoc = await employeeRef.get();

    if (!employeeDoc.exists) {
      return NextResponse.json(
        { message: "Employee not found" },
        { status: 404 }
      );
    }

    const employeeData = employeeDoc.data();
    const clientEntity = await getEntityDetailsFromDB(EntityType.CLIENT, employeeData?.client?.id);

    const filteredData = {
      firstName: employeeData?.firstName,
      lastName: employeeData?.lastName,
      email: employeeData?.email,
      designation: employeeData?.designation,
      startDate: employeeData?.startDate,
      employeeId: employeeData?.employeeId,
      clientName: clientEntity?.name,
    };


    return NextResponse.json(
      {
        message: "Employee info fetched successfully",
        response: filteredData,
      },
      { status: 200 } //explicit status
    );
  } catch (error) {
    console.error("Error fetching employee:", error); // Log the error
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
