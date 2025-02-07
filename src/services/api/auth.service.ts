import { auth } from "@/lib/firebase/auth";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import type {
  AuthFormData,
  AuthResponse,
  ResetPasswordResponse,
} from "@/types/features/auth";

export const authService = {
  async login(data: AuthFormData): Promise<AuthResponse> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const token = await userCredential.user.getIdToken();

      // Store token securely (e.g., HTTP-only cookies in API route)
      localStorage.setItem("token", token);

      return {
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          name: userCredential.user.displayName || undefined,
        },
        token,
      };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  },

  async register(data: AuthFormData): Promise<AuthResponse> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const token = await userCredential.user.getIdToken();

      localStorage.setItem("token", token);

      return {
        user: {
          id: userCredential.user.uid,
          email: userCredential.user.email!,
          name: userCredential.user.displayName || undefined,
        },
        token,
      };
    } catch (error) {
      console.error("Registration error:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    await signOut(auth);
    localStorage.removeItem("token");
    console.log("User logged out and token removed");
  },

  async verifyToken(): Promise<AuthResponse> {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("No token found");
    }

    const response = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      throw new Error("Token verification failed");
    }

    return response.json();
  },

  async forgotPassword(email: string): Promise<ResetPasswordResponse> {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      return data;
    } catch (error: any) {
      throw new Error(error.message || "Failed to send reset email");
    }
  },
};
