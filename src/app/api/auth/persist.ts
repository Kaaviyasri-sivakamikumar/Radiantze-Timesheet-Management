// src/app/api/auth/persist.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/firebase/auth";

export async function POST() {
  try {
    // Perform server-side actions, e.g., setting custom auth persistence
    // or handling tokens on the server
    return NextResponse.json({ message: "Persistence set successfully" });
  } catch (error) {
    console.error("Error setting persistence:", error);
    return NextResponse.json({ error: "Failed to set persistence" }, { status: 500 });
  }
}
