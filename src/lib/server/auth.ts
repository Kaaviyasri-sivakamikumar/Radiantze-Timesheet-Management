import { headers } from "next/headers";
import { auth } from "@/lib/firebase/auth";
import { FirebaseError } from "firebase/app";

export async function getCurrentUser() {
  try {
    const headersList = headers();
    const token = headersList.get("authorization")?.split(" ")[1];

    if (!token) return null;

    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken;
  } catch (error: unknown) {
    if (error instanceof FirebaseError) {
      console.error("Firebase auth error:", error.code, error.message);
    } else {
      console.error("Unknown error:", error);
    }
    return null;
  }
}
