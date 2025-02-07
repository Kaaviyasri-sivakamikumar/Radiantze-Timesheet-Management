import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";
import { sendPasswordResetEmail } from "firebase/auth";

export async function POST(request: Request) {
  try {
    const email = (await request.json()).email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Send password reset email using Firebase
    await sendPasswordResetEmail(auth, email);

    // Return a generic response for security purposes
    return NextResponse.json({
      success: true,
      message:
        "If an account with that email exists, a password reset email has been sent.",
    });
  } catch (error: any) {
    console.error(`Error Code: ${error.code}, Message: ${error.message}`);

    const errorMessage = (() => {
      switch (error.code) {
        case "auth/invalid-email":
          return "Invalid email format";
        case "auth/too-many-requests":
          return "Too many requests. Please try again later.";
        default:
          return "Failed to send password reset email";
      }
    })();

    const status = error.code === "auth/too-many-requests" ? 429 : 400;

    return NextResponse.json(
      { success: false, message: errorMessage },
      { status }
    );
  }
}
