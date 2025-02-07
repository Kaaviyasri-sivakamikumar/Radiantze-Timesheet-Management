"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmployee((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission logic here
    console.log("Employee Details:", employee);
  };

  return (
    <div className="container mx-auto py-10 px-20">
      <h1 className="text-2xl font-bold mb-4">Add Employee Details</h1>
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
          >
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}
