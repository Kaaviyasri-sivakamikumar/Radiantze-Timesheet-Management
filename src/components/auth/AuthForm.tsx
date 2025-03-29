"use client";

import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useRouter } from "next/navigation";
import { PasswordField } from "@/components/auth/PasswordField";
import { cn } from "@/lib/utils";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/Alert";

interface AuthFormProps {
  mode: "login" | "register";
}

export function AuthForm({ mode, ...props }: AuthFormProps) {
  const [email, setEmail] = useState("kaaviyasri.sivakamikumar@gmail.com");
  const [password, setPassword] = useState("987654321@");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { setUser, setToken, setIsAdmin } = useAuthContext();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      if (!email || !password) {
        throw new Error("Email and password are required");
      }

      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            `${mode === "login" ? "Login" : "Registration"} failed`
        );
      }

      // Set user and token in context
      setUser(data.user);
      setIsAdmin(data.user.isAdmin);
      setToken(data.token);

      // Save token to localStorage
      localStorage.setItem("token", data.token);

      // Show success message
      setSuccess(
        `Successfully ${mode === "login" ? "logged in" : "registered"}!`
      );

      // Navigate to homepage after a brief delay to show the success message
      setTimeout(() => {
        router.push("/");
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className={cn("flex flex-col gap-6")} {...props}>
      <CardHeader className="">
        <CardTitle className="text-xl font-inria text-[#1c5e93]">
          {mode === "login" ? "Login" : "Register"}
        </CardTitle>
        <CardDescription>
          Login with your registered email and password
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#1c5e93]">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[#1c5e93]">
                Password
              </Label>
              <Button
                variant="link"
                className="px-0 font-normal"
                type="button"
                onClick={() => router.push("/login/forgot-password")}
              >
                Forgot password?
              </Button>
            </div>
            <PasswordField
              label="Password"
              value={password}
              onChange={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              iconColor="#1c5e93"
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            style={{ backgroundColor: "#1c5e93", color: "white" }}
            disabled={isLoading}
          >
            {isLoading ? (
              <span>Loading...</span>
            ) : mode === "login" ? (
              "Login"
            ) : (
              "Add"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
