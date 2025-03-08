"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { string, z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import { AxiosError } from "axios";
import { Checkbox } from "@/components/ui/Checkbox";

import { useSearchParams } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import EmployeeCard from "@/components/employee/EmployeeCard";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useAuth } from "@/hooks/useAuth";

const employeeFormSchema = z.object({
  firstName: z
    .string()
    .min(2, "First Name must be at least 2 characters.")
    .max(200, "First Name must not exceed 200 characters."),
  lastName: z
    .string()
    .min(2, "Last Name must be at least 2 characters.")
    .max(200, "Last Name must not exceed 200 characters."),
  email: z
    .string()
    .email("Please enter a valid email.")
    .max(200, "Email must not exceed 200 characters."),
  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone must contain exactly 10 digits.")
    .max(10, "Phone must not exceed 10 digits.")
    .min(10, "Phone must contain at least 10 digits."),
  designation: z
    .string()
    .min(2, "Designation must be at least 2 characters.")
    .max(200, "Designation must not exceed 200 characters."),
  client: z
    .string()
    .max(200, "Client must not exceed 200 characters.")
    .nonempty("Client is required."),
  vendor: z
    .string()
    .max(200, "Vendor must not exceed 200 characters.")
    .optional(),
  startDate: z.string().nonempty("Start Date is required."),
  endDate: z.string().optional(),
  isAdminUser: z.boolean().optional(),
  visaStatus: z.string().nonempty("Visa Status is required."),
  additionalNotes: z.string().refine(
    (value) => {
      const wordCount = value.trim().split(/\s+/).length;
      return wordCount <= 3000;
    },
    {
      message: "additionalNotes must not exceed 3000 words",
    }
  ),
});

export default function EmployeeProfile() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({ resolver: zodResolver(employeeFormSchema) });

  const [isLoading, setIsLoading] = useState(false);
  const [isUpdateProfileFlow, setIsUpdateProfileFlow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("empid");

  const [initialValues, setInitialValues] = useState<EmployeeData | null>(null);
  const [isEmployeeDetailsUpdated, setIsEmployeeDetailsUpdated] =
    useState(false);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const { isAdmin } = useAuth();
  const currentRouter = useRouter();

  useEffect(() => {
    if (!isAdmin) {
      toast({
        title: "No permission",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [isAdmin, currentRouter]);

  const handleModifyEmployeeAccess = (disableAccess) => {
    // Check if disabling access and endDate is not filled
    if (disableAccess && !watch("endDate")) {
      toast({
        title: "Employment End Date Required",
        description: "Please fill in the End Date to disable the account.",
        variant: "destructive",
      });
      return; // Exit the function if validation fails
    }

    setConfirmDialogData({
      title: disableAccess
        ? "Account will be disabled"
        : "Account will be enabled",
      description: disableAccess
        ? "This action will lock the account and restrict access."
        : "This action will unlock the account and grant access.",
      onConfirm: () => modifyEmployeeAccess(disableAccess),
    });

    setIsConfirmDialogOpen(true);
  };

  const visaStatuses = [
    "B1", // Business Visitor
    "B2", // Tourist Visitor
    "CPT", // Curricular Practical Training
    "E2", // Treaty Investor
    "F1", // Student Visa
    "H1B", // Specialty Occupation
    "H2A", // Temporary Agricultural Workers
    "H2B", // Temporary Non-Agricultural Workers
    "I", // Media Visa
    "J1", // Exchange Visitor
    "K1", // Fiancé(e) Visa
    "L1", // Intra-company Transferee
    "M1", // Vocational Student
    "O1", // Extraordinary Ability
    "OPT", // Optional Practical Training
    "P1", // Internationally Recognized Athlete or Entertainer
    "Q1", // Cultural Exchange
    "R1", // Religious Worker
    "TN", // NAFTA Professional
    "V", // Spouse of a Permanent Resident
    "Other", // Other
  ];

  type EmployeeData = {
    authUid: string;
    employeeId: string;
    client: string;
    designation: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    vendor: string;
    startDate: string;
    endDate: string;
    isAdminUser: boolean;
    visaStatus: string;
    additionalNotes: string;
    accessDisabled: boolean;
  };
  const fetchEmployeeDetails = (employeeId: string) => {
    return service
      .getEmployee(employeeId)
      .then((response) => {
        const employeeData: EmployeeData = response.data.response;
        console.log(employeeData);
        // Populate form fields with employee data
        setValue("firstName", employeeData.firstName);
        setValue("lastName", employeeData.lastName);
        setValue("email", employeeData.email);
        setValue("designation", employeeData.designation);
        setValue("client", employeeData.client);
        setValue("vendor", employeeData.vendor);
        setValue("startDate", employeeData.startDate);
        setValue("endDate", employeeData.endDate);
        setValue("isAdminUser", employeeData.isAdminUser);
        setValue("visaStatus", employeeData.visaStatus);
        setValue("additionalNotes", employeeData.additionalNotes);
        setValue("accessDisabled", employeeData.accessDisabled);
        setValue("phone", employeeData.phone);

        // Set initial values for comparison
        setInitialValues(employeeData);
      })
      .catch((error) => {
        toast({
          title: "Employee not found",
          description: employeeId + " does not exisits in the records",
          variant: "destructive",
        });
        setError("Failed to fetch employee details."); // Handle error
      })
      .finally(() => {
        setIsLoading(false); // Set loading state to false
      });
  };

  useEffect(() => {
    if (employeeId) {
      // Check if employeeId is not empty
      setIsUpdateProfileFlow(true);
      fetchEmployeeDetails(employeeId).then(() => {});
    }
  }, [employeeId]);

  // New effect to track changes in form fields
  useEffect(() => {
    const subscription = watch((value) => {
      if (initialValues) {
        // Check if current values differ from initial values
        const hasChanges =
          value.firstName !== initialValues.firstName ||
          value.lastName !== initialValues.lastName ||
          value.email !== initialValues.email ||
          value.designation !== initialValues.designation ||
          value.client !== initialValues.client ||
          value.vendor !== initialValues.vendor ||
          value.startDate !== initialValues.startDate ||
          value.endDate !== initialValues.endDate ||
          value.isAdminUser !== initialValues.isAdminUser ||
          value.visaStatus !== initialValues.visaStatus ||
          value.additionalNotes !== initialValues.additionalNotes ||
          value.phone !== initialValues.phone;

        setIsEmployeeDetailsUpdated(hasChanges); // Update state based on comparison
      }
    });
    return () => subscription.unsubscribe(); // Cleanup subscription
  }, [watch, initialValues]);

  const onSubmit = async (data: any) => {
    if (isUpdateProfileFlow) {
      setIsLoading(true);
      setError("");
      setSuccess("");
      const updatedData = { ...initialValues, ...data }; // Merge existing data with updated values
      console.log("Updated employee data:", updatedData);

      try {
        await service.updateEmployee(updatedData).then((response) => {
          if (response.status === 200) {
            setSuccess("Employee details updated successfully!");
            // toast({
            //   title: "Success",
            //   description: "Employee updated successfully!",
            //   variant: "default",
            // });

            if (employeeId) {
              fetchEmployeeDetails(employeeId).then(() => {
                setIsLoading(false);
                setIsEmployeeDetailsUpdated(false);

                toast({
                  title: "Success",
                  description: "Employee updated successfully!",
                  variant: "default",
                });
              });
            }
          }
        });
      } catch (err) {
        if (err instanceof AxiosError) {
          const errorMessage =
            err.response?.data?.message ||
            err.message ||
            "Failed to update employee details";
          setError(errorMessage);
        } else {
          setError(
            "Failed to update employee details due to an unknown error."
          );
        }
      }
    } else {
      setIsLoading(true);
      setError("");
      setSuccess("");

      console.log("Register employee data:", data);

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
    }
  };

  const modifyEmployeeAccess = (disableAccess: boolean) => {
    let request = {
      disableAccess: disableAccess,
      authUid: initialValues ? initialValues.authUid : null,
      employeeId: initialValues ? initialValues.employeeId : null,
    };

    service
      .modifyEmployeeAccess(request)
      .then((response) => {
        if (employeeId) {
          fetchEmployeeDetails(employeeId).then((response) => {
            setIsLoading(false);
            setIsEmployeeDetailsUpdated(false);

            toast({
              title: disableAccess ? "Account disabled" : "Account enabled",
              description: disableAccess
                ? "Account is locked successfully"
                : "Account is unlocked successfully",
              variant: "default",
            });
          });
        }
      })
      .catch((error) => {
        toast({
          title: "Unable to modify employee access",
          description: "Something went wrong",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div className="ml-7 relative">
      <div className="absolute top-0 right-10 p-4">
        <div className="flex items-center space-x-2 bg-red-100 p-2 rounded-lg">
          <Checkbox
            id="isAdmin"
            checked={watch("isAdminUser")}
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
        {isUpdateProfileFlow && initialValues && (
          <div className="mb-10">
            <EmployeeCard
              firstName={initialValues.firstName}
              lastName={initialValues.lastName}
              employeeId={initialValues.employeeId}
              designation={initialValues.designation}
              startDate={initialValues.startDate}
              endDate={initialValues.endDate}
              isActive={!initialValues.accessDisabled}
            />
          </div>
        )}

        {!isUpdateProfileFlow && (
          <h1 className="text-3xl font-bold text-gray-800 mb-6 font-inria">
            Employee Registration Form
          </h1>
        )}

        {!isUpdateProfileFlow && (
          <p className="text-gray-600 mb-8">
            Please provide accurate details for the employee record. Fields
            marked with * are required.
          </p>
        )}

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
            <Label>
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input type="text" {...register("firstName")} />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input type="text" {...register("lastName")} />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              type="email"
              {...register("email")}
              disabled={isUpdateProfileFlow}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Designation <span className="text-red-500">*</span>
            </Label>
            <Input type="text" {...register("designation")} />
            {errors.designation && (
              <p className="text-red-500 text-sm">
                {errors.designation.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Client <span className="text-red-500">*</span>
            </Label>
            <Input type="text" {...register("client")} />
            {errors.client && (
              <p className="text-red-500 text-sm">{errors.client.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Vendor</Label>
            <Input type="text" {...register("vendor")} />
            {errors.vendor && (
              <p className="text-red-500 text-sm">{errors.vendor.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>
              Employment Start Date <span className="text-red-500">*</span>
            </Label>
            <Input type="date" {...register("startDate")} />
            {errors.startDate && (
              <p className="text-red-500 text-sm">{errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Employment End Date</Label>
            <Input type="date" {...register("endDate")} />
          </div>

          <div className="space-y-2">
            <Label>
              Visa Status <span className="text-red-500">*</span>
            </Label>
            <DropdownMenu {...register("visaStatus")}>
              <DropdownMenuTrigger asChild className="ml-4">
                <Button variant="outline">
                  {watch("visaStatus") || "Select Visa Status"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="max-h-60 overflow-y-auto">
                {" "}
                {visaStatuses.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => setValue("visaStatus", status)}
                  >
                    {status}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {errors.visaStatus && (
              <p className="text-red-500 text-sm">
                {errors.visaStatus.message}
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label>
              Phone Number <span className="text-red-500">*</span>
            </Label>
            <Input type="tel" {...register("phone")} />
            {errors.phone && (
              <p className="text-red-500 text-sm">{errors.phone.message}</p>
            )}
          </div>

          <div className="col-span-2 space-y-2">
            <Label>Additional Notes</Label>
            <textarea
              {...register("additionalNotes")}
              className="w-full border rounded-md p-2"
              rows={4}
              placeholder="Enter any additional notes here..."
            />
            {errors.additionalNotes && (
              <p className="text-red-500 text-sm">
                {errors.additionalNotes.message}
              </p>
            )}
          </div>

          <div className="col-span-2 flex justify-end">
            {isUpdateProfileFlow && (
              <Button
                type="button"
                className="w-full md:w-auto px-6 py-3 text-lg mr-4"
                variant={!watch("accessDisabled") ? "destructive" : "default"}
                onClick={() =>
                  handleModifyEmployeeAccess(!initialValues?.accessDisabled)
                }
              >
                {watch("accessDisabled") ? "Enable" : "Disable"}
              </Button>
            )}

            <Button
              type="submit"
              className={`w-full md:w-auto px-6 py-3 text-lg`}
              disabled={
                isLoading || (!isEmployeeDetailsUpdated && isUpdateProfileFlow)
              }
            >
              {isLoading
                ? isUpdateProfileFlow
                  ? "Updating..."
                  : "Registering..."
                : isUpdateProfileFlow
                ? "Update"
                : "Register"}
            </Button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={isConfirmDialogOpen}
        setOpen={setIsConfirmDialogOpen}
        title={confirmDialogData.title}
        description={confirmDialogData.description}
        onConfirm={confirmDialogData.onConfirm}
        confirmText="Yes, Proceed"
        cancelText="No, Cancel"
      />
    </div>
  );
}
