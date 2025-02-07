"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";

export default function AuthPage() {
  return (
    <div className="container mx-auto py-10">
      <AuthFormWrapper mode="login" />
    </div>
  );
}
