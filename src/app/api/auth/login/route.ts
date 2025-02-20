import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { adminAuth } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    const token = await userCredential.user.getIdToken();
    const userRecord = await adminAuth.getUser(userCredential.user.uid);


    return NextResponse.json({
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        name: userCredential.user.displayName || "",
        isAdmin: userRecord.customClaims?.isAdmin || false,
      },
      token,
    });
  } catch (error: any) {
    // Handle Firebase auth errors
    const errorMessage = (() => {
      switch (error.code) {
        case "auth/invalid-email":
          return "Invalid email format";
        case "auth/user-disabled":
          return "This account has been disabled";
        case "auth/user-not-found":
          return "No account found with this email";
        case "auth/wrong-password":
          return "Invalid password";
        default:
          return "Login failed";
      }
    })();

    return NextResponse.json({ message: errorMessage }, { status: 401 });
  }
}
