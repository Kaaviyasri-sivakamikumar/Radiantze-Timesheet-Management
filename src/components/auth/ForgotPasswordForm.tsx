"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { authService } from "@/services/api/auth.service";
import { useRouter } from "next/navigation";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email); // Assume this returns a server response
      if (response.success) {
        setSuccess(response.message); // Use the dynamic success message from server
      } else {
        setError(response.message || "Failed to send reset email"); // Use the server error message
      }
      setEmail(""); // Reset email field
    } catch (err) {
      // In case the API throws an error that isn't handled in the response
      setError(
        err instanceof Error ? err.message : "Failed to send reset email"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Sending..." : "Reset Password"}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => router.push("/auth")}
          className="mt-4"
        >
          Back to Login
        </Button>
      </div>
    </div>
  );
}
