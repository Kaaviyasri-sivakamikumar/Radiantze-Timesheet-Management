"use client";

import { AuthFormWrapper } from "@/components/auth/AuthFormWrapper";
import { GalleryVerticalEnd } from "lucide-react";

export default function AuthPage() {
  return (
    <div className="flex h-screen bg-gray-100 flex-col items-center justify-center gap-6 bg-muted">
      <div className="flex justify-center  shadow-sm items-center">
        <img src="/onTime_Logo.png" alt="Logo" className="w-40 rounded-md" />
      </div>
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AuthFormWrapper mode="login" />
      </div>

      <div className="text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 [&_a]:hover:text-primary">
        By clicking continue, you agree to our{" "}
        <a href="https://radiantze.com/">Terms of Service</a> and{" "}
        <a href="https://radiantze.com/">Privacy Policy</a>.
      </div>
    </div>
  );
}
