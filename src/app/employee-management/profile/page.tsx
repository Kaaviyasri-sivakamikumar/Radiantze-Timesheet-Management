"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { string, z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import { AxiosError } from "axios";
import { Checkbox } from "@/components/ui/Checkbox";

import { useSearchParams } from "next/navigation";

const employeeFormSchema = z.object({
  firstName: z.string().min(2, "First Name must be at least 2 characters."),
  lastName: z.string().min(2, "Last Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  designation: z.string().min(2, "Designation must be at least 2 characters."),
  client: z.string().optional(),
  vendor: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isAdminUser: z.boolean().optional(),
});

export default function EmployeeProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm({ resolver: zodResolver(employeeFormSchema) });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("empid");

  useEffect(() => {
    if (employeeId) {
      // Check if employeeId is not empty
      setIsLoading(true); // Set loading state to true
      service
        .getEmployee(employeeId)
        .then((response) => {
          const data = response.data.response;
          console.log(data);
        })
        .catch((error) => {
          setError("Failed to fetch employee details."); // Handle error
        })
        .finally(() => {
          setIsLoading(false); // Set loading state to false
        });
    }
  }, [employeeId]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await service.createEmployee(data).then((response) => {
        if (response.status === 200) {
          setSuccess("Employee details saved successfully!");
        }
      });

      toast({
        title: "Success",
        description: "Employee registered successfully!",
        variant: "default",
      });

      setTimeout(() => {
        router.push("/employee-management");
      });
    } catch (err) {
      if (err instanceof AxiosError) {
        const errorMessage =
          err.response?.data?.message ||
          err.message ||
          "Failed to save employee details";
        setError(errorMessage);
      } else {
        setError("Failed to save employee details due to an unknown error.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-7 relative">
      <div className="absolute top-0 right-10 p-4">
        <div className="flex items-center space-x-2 bg-red-100 p-2 rounded-lg">
          <Checkbox
            id="isAdmin"
            onCheckedChange={(checked) => setValue("isAdminUser", checked)}
          />
          <div className="grid gap-1.5 leading-none">
            <label
              htmlFor="isAdmin"
              className="text-sm font-medium leading-none text-red-700"
            >
              Admin User (Sensitive)
            </label>
            <p className="text-xs">Grants full employee access.</p>
          </div>
        </div>
      </div>

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
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
