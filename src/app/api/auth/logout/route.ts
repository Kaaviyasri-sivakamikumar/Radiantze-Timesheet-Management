import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

export async function POST(request: Request) {
  try {
    await signOut(auth);
    return NextResponse.json({
      status: "Sucessfully logged out!",
    });
  } catch (error: any) {
    return NextResponse.json({ status: "Failed to logout" }, { status: 401 });
  }
}
