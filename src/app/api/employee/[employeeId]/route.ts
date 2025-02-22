"use server";
import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { randomBytes } from "crypto";
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
export async function GET(request: Request, { params }: { params: { employeeId: string } }) {
  // Await the params to ensure they are resolved before use
  const { employeeId } = await params;

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

  return NextResponse.json(
    { message: "Employee details fetched successfully", response: employeeData }
  );

}
