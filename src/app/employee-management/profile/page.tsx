"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/Alert";

export default function EmployeeProfile() {
  const [employee, setEmployee] = useState({
    name: "",
    id: "",
    email: "",
    designation: "",
    client: "",
    vendor: "",
    startDate: "",
    endDate: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      // Validate required fields
      const requiredFields = ["name", "id", "email", "designation"];
      const missingFields = requiredFields.filter((field) => !employee[field]);

      if (missingFields.length > 0) {
        throw new Error(
          `Please fill in all required fields: ${missingFields.join(", ")}`
        );
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Authentication required. Please login again.");
      }

      // Call the API endpoint
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(employee),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save employee details");
      }

      setSuccess("Employee details saved successfully!");

      // Redirect after successful save
      setTimeout(() => {
        router.push("/employee-management");
      }, 2000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save employee details"
      );

      // Handle authentication errors
      if (
        err instanceof Error &&
        err.message.includes("Authentication required")
      ) {
        setTimeout(() => {
          router.push("/auth");
        }, 2000);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10 px-20">
      <h1 className="text-2xl font-bold mb-4">Add Employee Details</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2">Employee Name</label>
          <Input
            type="text"
            name="name"
            value={employee.name}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Employee ID</label>
          <Input
            type="text"
            name="id"
            value={employee.id}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Email</label>
          <Input
            type="email"
            name="email"
            value={employee.email}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Designation</label>
          <Input
            type="text"
            name="designation"
            value={employee.designation}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Client</label>
          <Input
            type="text"
            name="client"
            value={employee.client}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Vendor</label>
          <Input
            type="text"
            name="vendor"
            value={employee.vendor}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Employment Start Date</label>
          <Input
            type="date"
            name="startDate"
            value={employee.startDate}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block mb-2">Employment End Date</label>
          <Input
            type="date"
            name="endDate"
            value={employee.endDate}
            onChange={handleChange}
            className="border p-2 w-full"
          />
        </div>
        <div className="col-span-2 flex justify-start">
          <Button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </div>
  );
}
