"use server";
import { NextResponse, type NextRequest } from "next/server";
import { getFirestore } from "firebase-admin/firestore";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Record<string, string> }
) {
  const { employeeId } = params;

  const db = getFirestore();
  const employeeRef = db.collection("employees").doc(employeeId);
  const employeeDoc = await employeeRef.get();

  if (!employeeDoc.exists) {
    return NextResponse.json({ message: "Employee not found" }, { status: 404 });
  }

  const employeeData = employeeDoc.data();

  return NextResponse.json({
    message: "Employee details fetched successfully",
    response: employeeData,
  });
}
