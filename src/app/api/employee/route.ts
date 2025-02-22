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

export async function GET(request: Request) {


  const db = getFirestore();
  const counterRef = db.collection("employees");
  const snapshot = await counterRef.get();
  const data = snapshot.docs.map((doc) => doc.data());


  return NextResponse.json(
    { message: "Employee details fetched successfully",
       response: data }
  );
}
