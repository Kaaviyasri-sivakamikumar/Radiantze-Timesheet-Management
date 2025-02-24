"use client"; // <-- This tells Next.js that this is a client-side component

import { useAuth } from "../hooks/useAuth";
import { useRouter } from "next/navigation"; // Import from next/navigation
import { useState, useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="mb-4">You must be logged in to access this page.</p>
        <button
          onClick={() => router.push("/auth")}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
        <p className="mb-4">
          Signed in as: <span className="font-semibold">{user.email}</span>
        </p>
        <button
          onClick={() => router.push("/employee-management/profile")}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Add Employee
        </button>
      </div>
    </div>
  );
}
