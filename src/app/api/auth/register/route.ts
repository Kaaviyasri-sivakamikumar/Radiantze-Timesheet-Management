import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Get the ID token
      const token = await user.getIdToken();

      return NextResponse.json({
        user: {
          id: user.uid,
          email: user.email,
          name: user.displayName || "",
        },
        token,
      });
    } catch (firebaseError: any) {
      // Handle specific Firebase auth errors
      const errorMessage = (() => {
        switch (firebaseError.code) {
          case "auth/email-already-in-use":
            return "Email already registered";
          case "auth/invalid-email":
            return "Invalid email format";
          case "auth/operation-not-allowed":
            return "Email/password accounts are not enabled";
          case "auth/weak-password":
            return "Password is too weak";
          default:
            return "Registration failed";
        }
      })();

      return NextResponse.json({ message: errorMessage }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}



