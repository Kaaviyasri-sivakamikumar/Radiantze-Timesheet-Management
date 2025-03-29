"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { string, z } from "zod";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "@/components/ui/Alert";
import { Label } from "@/components/ui/label";
import { Info, Loader2 } from "lucide-react";
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
import { EntityManagementDialog } from "@/components/EntityManagementDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

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
  client: z.object({ id: z.string().nonempty("Client is required.") }), // Updated
  vendor: z.object({ id: z.string().optional() }).optional(), // Updated
  startDate: z.string().nonempty("Start Date is required."),
  endDate: z.string().optional(),
  isAdminUser: z.boolean().optional(),
  visaStatus: z.object({
    id: z.string().nonempty("Visa Status is required."),
  }), // Updated
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

// Create a client component that uses useSearchParams
function EmployeeProfileContent() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({ resolver: zodResolver(employeeFormSchema) });

  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // new state
  const [isUpdateProfileFlow, setIsUpdateProfileFlow] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const employeeId = searchParams.get("empid");
  const [vendorEntities, setVendorEntities] = useState<any[]>([]);
  const [clientEntities, setClientEntities] = useState<any[]>([]);
  const [visaEntities, setVisaEntities] = useState<any[]>([]); // Added visa entities

  const [initialValues, setInitialValues] = useState<EmployeeData | null>(null);
  const [isEmployeeDetailsUpdated, setIsEmployeeDetailsUpdated] =
    useState(false);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState({
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const { isAdmin, isAuthenticating } = useAuth();
  const currentRouter = useRouter();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [entityType, setEntityType] = useState<"client" | "vendor" | "visa">(
    "client"
  ); // Default to client

  useEffect(() => {
    if (!isAdmin && !isAuthenticating) {
      toast({
        title: "No permission",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [isAdmin, currentRouter, isAuthenticating]);

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

  type EmployeeData = {
    authUid: string;
    employeeId: string;
    client: { id: string }; // Store ID
    designation: string;
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    vendor: { id: string } | null; // Store ID
    startDate: string;
    endDate: string;
    isAdminUser: boolean;
    visaStatus: { id: string }; // Store ID
    additionalNotes: string;
    accessDisabled: boolean;
  };

  const fetchEmployeeDetails = (employeeId: string) => {
    return service
      .getEmployee(employeeId)
      .then((response) => {
        const employeeData: EmployeeData = response.data.response;
        console.log(employeeData);
        // Populate form fields with employee data, but lookup the name
        setValue("firstName", employeeData.firstName);
        setValue("lastName", employeeData.lastName);
        setValue("email", employeeData.email);
        setValue("designation", employeeData.designation);
        setValue("client", employeeData.client); // Client ID
        setValue("vendor", employeeData.vendor); // Vendor ID
        setValue("startDate", employeeData.startDate);
        setValue("endDate", employeeData.endDate);
        setValue("isAdminUser", employeeData.isAdminUser);
        setValue("visaStatus", employeeData.visaStatus); //Visa ID
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
        setIsInitialLoad(false); // Data is loaded, turn off initial load
      });
  };

  const fetchEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vendorsResponse, clientsResponse, visaResponse] =
        await Promise.all([
          service.getEntities("vendor"),
          service.getEntities("client"),
          service.getEntities("visa"), // Fetch visa entities
        ]);

      if (vendorsResponse.data.success) {
        setVendorEntities(vendorsResponse.data.entities);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch vendors",
          variant: "destructive",
        });
      }

      if (clientsResponse.data.success) {
        setClientEntities(clientsResponse.data.entities);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch clients",
          variant: "destructive",
        });
      }

      if (visaResponse.data.success) {
        setVisaEntities(visaResponse.data.entities);
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch visas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Error fetching entities",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (employeeId) {
      // Check if employeeId is not empty
      setIsUpdateProfileFlow(true);
      fetchEmployeeDetails(employeeId).then(() => {});
    } else {
      setIsInitialLoad(false); // If no employeeId, immediately disable the skeleton
    }

    fetchEntities(); // Fetch vendors and clients on mount
  }, [employeeId, fetchEntities]);

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
          value.client.id !== initialValues.client.id ||
          (value.vendor?.id || null) !== (initialValues.vendor?.id || null) || // Handle optional vendor
          value.startDate !== initialValues.startDate ||
          value.endDate !== initialValues.endDate ||
          value.isAdminUser !== initialValues.isAdminUser ||
          value.visaStatus.id !== initialValues.visaStatus.id ||
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

  const handleOpenEditDialog = (type: "client" | "vendor" | "visa") => {
    setEntityType(type);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = (updatedEntities?: any[]) => {
    setIsEditDialogOpen(false);
    if (updatedEntities) {
      if (entityType === "client") {
        setClientEntities(updatedEntities);
      } else if (entityType === "vendor") {
        setVendorEntities(updatedEntities);
      } else if (entityType === "visa") {
        setVisaEntities(updatedEntities);
      }
    }
  };

  // Function to find the name from id
  const getEntityName = (id: string | undefined, entities: any[]) => {
    if (!id) return "";
    const entity = entities.find((entity) => entity.id === id);
    return entity ? entity.name : "";
  };

  const SkeletonForm = () => (
    <div className="grid grid-cols-2 gap-6">
      <div className="space-y-2">
        <Label>First Name</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Last Name</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Email</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Designation</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Client</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Vendor</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Employment Start Date</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Employment End Date</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="space-y-2">
        <Label>Phone Number</Label>
        <Skeleton className="h-10 w-full" />
      </div>

      <div className="col-span-2 space-y-2">
        <Label>Additional Notes</Label>
        <Skeleton className="h-24 w-full" />
      </div>

      <div className="col-span-2 flex justify-end">
        <Skeleton className="h-10 w-32 mr-4" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );

  const renderFormContent = () => {
    return (
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
            <p className="text-red-500 text-sm">{errors.designation.message}</p>
          )}
        </div>

        {/* Client Dropdown */}
        <div className="space-y-2">
          <Label>
            Client <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value) => setValue("client.id", value)} // Updated
            disabled={isLoading}
            value={watch("client")?.id} // Updated
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : clientEntities.length > 0 ? (
                    getEntityName(watch("client")?.id, clientEntities) || // Updated
                    "Select a Client"
                  ) : (
                    "Loading Clients..."
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoading || clientEntities.length === 0
                ? null
                : clientEntities.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {errors.client && (
            <p className="text-red-500 text-sm">
              {errors.client.id?.message || errors.client.message}
            </p> // Updated
          )}
          <a
            onClick={() => handleOpenEditDialog("client")}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          >
            Manage Clients
          </a>
        </div>

        {/* Vendor Dropdown */}
        <div className="space-y-2">
          <Label>Vendor</Label>
          <Select
            onValueChange={(value) => setValue("vendor.id", value)} // Updated
            disabled={isLoading}
            value={watch("vendor")?.id} // Updated
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : vendorEntities.length > 0 ? (
                    getEntityName(watch("vendor")?.id, vendorEntities) || // Updated
                    "Select a Vendor"
                  ) : (
                    "Loading Vendors..."
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoading || vendorEntities.length === 0
                ? null
                : vendorEntities.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.id}>
                      {vendor.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {errors.vendor && (
            <p className="text-red-500 text-sm">
              {errors.vendor.id?.message || errors.vendor.message}
            </p> // Updated
          )}
          <a
            onClick={() => handleOpenEditDialog("vendor")}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          >
            Manage Vendors
          </a>
        </div>

        {/* Visa Dropdown */}
        <div className="space-y-2">
          <Label>
            Visa Status <span className="text-red-500">*</span>
          </Label>
          <Select
            onValueChange={(value) => setValue("visaStatus.id", value)} // Updated
            disabled={isLoading}
            value={watch("visaStatus")?.id} // Updated
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : visaEntities.length > 0 ? (
                    getEntityName(watch("visaStatus")?.id, visaEntities) || // Updated
                    "Select a Visa Status"
                  ) : (
                    "Loading Visas..."
                  )
                }
              />
            </SelectTrigger>
            <SelectContent>
              {isLoading || visaEntities.length === 0
                ? null
                : visaEntities.map((visa) => (
                    <SelectItem key={visa.id} value={visa.id}>
                      {visa.name}
                    </SelectItem>
                  ))}
            </SelectContent>
          </Select>
          {errors.visaStatus && (
            <p className="text-red-500 text-sm">
              {errors.visaStatus.id?.message || errors.visaStatus.message}
            </p> // Updated
          )}
          <a
            onClick={() => handleOpenEditDialog("visa")}
            className="text-blue-500 hover:text-blue-700 transition-colors duration-200 cursor-pointer"
          >
            Manage Visas
          </a>
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
    );
  };

  return (
    <div className="ml-7 relative">
      <div className="absolute top-0 right-10 p-4">
        <div className="flex items-start space-x-3 bg-red-50 border border-red-200 p-4 rounded-xl transition-all duration-200 w-[270px]">
          <Checkbox
            id="isAdmin"
            checked={watch("isAdminUser")}
            onCheckedChange={(checked) => setValue("isAdminUser", checked)}
            className="mt-1"
          />
          <div className="grid gap-1 leading-tight text-sm text-red-800">
            <label htmlFor="isAdmin" className="font-semibold text-red-700">
              Admin User <span className="text-xs">(Sensitive)</span>
            </label>
            <p className="text-xs flex items-center text-red-600">
              <Info className="w-3.5 h-3.5 mr-1" />
              Grants full employee access
            </p>
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

        {isInitialLoad ? (
          <SkeletonForm />
        ) : (
          renderFormContent() // Render the dropdowns in both cases
        )}
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

      <EntityManagementDialog
        open={isEditDialogOpen}
        setOpen={setIsEditDialogOpen}
        entityType={entityType}
        initialEntities={
          entityType === "client"
            ? clientEntities
            : entityType === "vendor"
            ? vendorEntities
            : visaEntities
        }
        onClose={handleCloseEditDialog}
      />
    </div>
  );
}

// Main page component
export default function EmployeeProfile() {
  return (
    <Suspense fallback={<SkeletonForm />}>
      <EmployeeProfileContent />
    </Suspense>
  );
}
