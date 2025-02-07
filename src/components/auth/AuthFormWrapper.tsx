"use client";

import { AuthForm } from "./AuthForm";

export function AuthFormWrapper({ mode }: { mode: "login" | "register" }) {
  return <AuthForm mode={mode} />;
}
