"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import { AxiosError } from "axios";

const employeeFormSchema = z.object({
  firstName: z.string().min(2, "First Name must be at least 2 characters."),
  lastName: z.string().min(2, "Last Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  designation: z.string().min(2, "Designation must be at least 2 characters."),
  client: z.string().optional(),
  vendor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export default function EmployeeProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(employeeFormSchema) });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // employeeRegisteringToast = toast({
      //   title: (
      //     <span className="flex items-center">
      //       <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Registering
      //       employee!
      //     </span>
      //   ),
      //   description: "Please wait while we register the employee.",
      //   duration: 1000000000000000000,
      // });

      await service.createEmployee(data).then((response) => {
        if (response.status === 200) {
          // employeeRegisteringToast.dismiss();
          setSuccess("Employee details saved successfully!");
        }
      });

      toast({
        title: "Success",
        description: "Employee registered successfully!",
        variant: "default",
      });

      // Redirect after a short delay
      setTimeout(() => {
        router.push("/employee-management");
      });
    } catch (err) {
      // employeeRegisteringToast.dismiss();

      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to save employee details";
        setError(errorMessage);
      } else {
        setError("Failed to save employee details due to an unknown error.");
      }

      // Handle authentication errors
      // if (errorMessage.includes("Invalid or expired token")) {
      //   toast({
      //     title: "Session expired",
      //     description: "Please log in again to continue.",
      //     variant: "destructive",
      //   });

      //   setTimeout(() => {
      //     router.push("/login");
      //   }, 500);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-7">
      <div className="w-full max-w-5xl bg-white rounded-lg pb-32">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          Employee Registration Form
        </h1>
        <p className="text-gray-600 mb-8">
          Please provide accurate details for the employee record. Fields marked
          with * are required.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="grid grid-cols-2 gap-6"
        >
          <div className="space-y-2">
            <Label>First Name *</Label>
            <Input type="text" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Last Name *</Label>
            <Input type="text" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Email *</Label>
            <Input type="email" {...register("email")} />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Designation *</Label>
            <Input type="text" {...register("designation")} />
            {errors.designation && (
              <p className="text-red-500 text-sm">
                {errors.designation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Client</Label>
            <Input type="text" {...register("client")} />
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Input type="text" {...register("vendor")} />
          </div>

          <div className="space-y-2">
            <Label>Employment Start Date</Label>
            <Input type="date" {...register("startDate")} />
          </div>

          <div className="space-y-2">
            <Label>Employment End Date</Label>
            <Input type="date" {...register("endDate")} />
          </div>

          <div className="col-span-2 flex justify-end">
            <Button
              type="submit"
              className="w-full md:w-auto px-6 py-3 text-lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Registering...
                </span>
              ) : (
                "Register"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
