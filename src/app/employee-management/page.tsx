"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
  FilterFns,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  UserRoundPlus,
  Search,
  ArrowUp,
  ArrowDown,
  ChevronUp,
  ChevronsUpDown,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { service } from "@/services/service";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

export type EmployeeData = {
  employeeId: string;
  client: { id: string };
  designation: string;
  email: string;
  firstName: string;
  lastName: string;
  vendor: { id: string } | null;
  visaStatus: { id: string };
  startDate: string;
  phoneNumber: string;
};

// Define Filter Functions
const filterFns: FilterFns = {
  customEquals: (row, columnId, filterValue: any) => {
    const value = row.original[columnId]?.id;
    return value === filterValue;
  },
};

// Extend ColumnDef to include filter properties
interface CustomColumnDef<TData, TValue> extends ColumnDef<TData, TValue> {
  filterType?: "select";
  filterOptions?: string[]; // For select filter
  customFilterFn?: FilterFn<TData>;
}

const columns: CustomColumnDef<EmployeeData, any>[] = [
  {
    accessorKey: "employeeId",
    header: "EMPLOYEE ID",
    cell: ({ row }) => <div>{row.getValue("employeeId") || "NA"}</div>,
  },
  {
    accessorKey: "firstName",
    header: "FIRST NAME",
    cell: ({ row }) => <div>{row.getValue("firstName") || "NA"}</div>,
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() =>
            column.toggleSorting(
              isSorted === "asc"
                ? "desc"
                : isSorted === "desc"
                ? false
                : "desc",
              true
            )
          }
        >
          LAST NAME
          {isSorted === "asc" ? (
            <ChevronUp />
          ) : isSorted === "desc" ? (
            <ChevronDown />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("lastName") || "NA"}</div>,
  },
  {
    accessorKey: "client",
    header: "CLIENT",
    cell: ({ row, table }) => {
      const { clientEntities } = (table.options.meta as any) || {};
      const clientId = row.original.client?.id;
      const client = clientEntities?.find((c: any) => c.id === clientId);
      return <div>{client?.name || "NA"}</div>;
    },
    filterType: "select",
    customFilterFn: (row, columnId, filterValue: any) => {
      const value = row.original[columnId]?.id;
      return value === filterValue;
    },
  },
  {
    accessorKey: "designation",
    header: "DESIGNATION",
    cell: ({ row }) => <div>{row.getValue("designation") || "NA"}</div>,
    filterType: "select",
    customFilterFn: filterFns.customEquals,
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
        >
          EMAIL
          {isSorted === "asc" ? (
            <ChevronUp />
          ) : isSorted === "desc" ? (
            <ChevronDown />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="lowercase">{row.getValue("email") || "NA"}</div>
    ),
  },
  {
    accessorKey: "vendor",
    header: "VENDOR",
    cell: ({ row, table }) => {
      const { vendorEntities } = (table.options.meta as any) || {};
      const vendorId = row.original.vendor?.id;
      const vendor = vendorEntities?.find((v: any) => v.id === vendorId);
      return <div>{vendor?.name || "NA"}</div>;
    },
    filterType: "select",
    customFilterFn: (row, columnId, filterValue: any) => {
      const value = row.original[columnId]?.id;
      return value === filterValue;
    },
  },
  {
    accessorKey: "visaStatus",
    header: "VISA STATUS",
    cell: ({ row, table }) => {
      const { visaEntities } = (table.options.meta as any) || {};
      const visaId = row.original.visaStatus?.id;
      const visa = visaEntities?.find((v: any) => v.id === visaId);
      return <div>{visa?.name || "NA"}</div>;
    },
    filterType: "select",
    customFilterFn: (row, columnId, filterValue: any) => {
      const value = row.original[columnId]?.id;
      return value === filterValue;
    },
  },
  {
    accessorKey: "phoneNumber",
    header: "PHONE NUMBER",
    cell: ({ row }) => <div>{row.getValue("phoneNumber") || "NA"}</div>,
  },

  {
    accessorKey: "startDate",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();

      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(isSorted === "asc")}
        >
          START DATE
          {isSorted === "asc" ? (
            <ChevronUp />
          ) : isSorted === "desc" ? (
            <ChevronDown />
          ) : (
            <ChevronsUpDown />
          )}
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.getValue("startDate") || "NA"}</div>,
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date((rowA.getValue(columnId) as string) || ""); // Handle potential null/undefined values
      const dateB = new Date((rowB.getValue(columnId) as string) || ""); // Handle potential null/undefined values
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;
      const router = useRouter();

      const handleViewEmployee = () => {
        router.push(
          `/employee-management/employee-profile?empid=${employee.employeeId}`
        );
      };

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleViewEmployee}>
              View employee
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

const SkeletonTable = () => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id || column.accessorKey}>
                <Skeleton className="h-4 w-[100px]" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array(5)
            .fill(null)
            .map((_, i) => (
              <TableRow key={`skeleton-row-${i}`}>
                {columns.map((column) => (
                  <TableCell key={`${column.id || column.accessorKey}-${i}`}>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                ))}
              </TableRow>
            ))}
        </TableBody>
      </Table>
    </div>
  );
};

const SkeletonFilter = () => <Skeleton className="h-10 w-64" />;

const SkeletonColumnsButton = () => <Skeleton className="h-10 w-24 ml-auto" />;

function SelectFilter({ column, options }: { column: any; options: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
          <Filter className="h-4 w-4 " />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((option) => (
          <DropdownMenuItem
            key={option}
            onClick={() => column.setFilterValue(option)}
          >
            {option || "NA"}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem onClick={() => column.setFilterValue("")}>
          Clear Filter
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function UserManagement() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [employeeData, setEmployeeData] = React.useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [clientOptions, setClientOptions] = React.useState<string[]>([]);
  const [vendorOptions, setVendorOptions] = React.useState<string[]>([]);
  const [designationOptions, setDesignationOptions] = React.useState<string[]>(
    []
  );

  const [clientEntities, setClientEntities] = useState<any[]>([]);
  const [vendorEntities, setVendorEntities] = useState<any[]>([]);
  const [visaEntities, setVisaEntities] = useState<any[]>([]);

  const { isAdmin, isAuthenticating } = useAuth();
  const currentRouter = useRouter();
  const router = useRouter();

  const fetchEntities = useCallback(async () => {
    setIsLoading(true);
    try {
      const [vendorsResponse, clientsResponse, visaResponse] =
        await Promise.all([
          service.getEntities("vendor"),
          service.getEntities("client"),
          service.getEntities("visa"),
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
          description: "Failed to fetch visa",
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
    if (!isAdmin && !isAuthenticating) {
      toast({
        title: "No permission",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      router.push("/");
    }
  }, [isAdmin, currentRouter, isAuthenticating, router, toast]);

  useEffect(() => {
    setIsLoading(true);
    fetchEntities();

    service
      .getEmployees()
      .then((response) => {
        const data = response.data.response;

        const processedData = data.map((item: any) => ({
          ...item,
          employeeId: item.employeeId || "NA",
          client: item.client ? { id: item.client.id } : null,
          designation: item.designation || "NA",
          email: item.email || "NA",
          firstName: item.firstName || "NA",
          lastName: item.lastName || "NA",
          vendor: item.vendor ? { id: item.vendor.id } : null,
          visaStatus: item.visaStatus ? { id: item.visaStatus.id } : null,
          startDate: item.startDate || "NA",
          phoneNumber: item.phoneNumber || "NA",
        })) as EmployeeData[];

        setEmployeeData(processedData);

        // Extract unique client, vendor and designation values
        const uniqueClients = [
          ...new Set(
            processedData.map((item) => item.client?.id).filter(Boolean)
          ),
        ];
        const uniqueVendors = [
          ...new Set(
            processedData.map((item) => item.vendor?.id).filter(Boolean)
          ),
        ];
        const uniqueDesignations = [
          ...new Set(processedData.map((item) => item.designation)),
        ];

        setClientOptions(uniqueClients as string[]);
        setVendorOptions(uniqueVendors as string[]);
        setDesignationOptions(uniqueDesignations);
      })
      .catch((error) => {
        console.error("Error fetching employees:", error);
        toast({
          title: "Error",
          description: "Failed to fetch employee data.",
          variant: "destructive",
        });
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [fetchEntities, router, toast]);

  const table = useReactTable({
    data: employeeData,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      globalFilter,
    },
    meta: {
      clientEntities,
      vendorEntities,
      visaEntities,
    },
  });

  const handleAddUser = () => {
    router.push("/employee-management/employee-profile");
  };

  const handleClearFilters = () => {
    table.resetColumnFilters();
  };

  const isAnyFilterApplied =
    columnFilters.length > 0 || globalFilter.length > 0;

  return (
    <div className="ml-7 relative mr-7">
      <div className="w-full bg-white rounded-lg pb-32">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 font-inria">
            Employee Management
          </h1>

          <Button
            onClick={handleAddUser}
            className="bg-[#1c5e93] text-white hover:bg-[#1c5e93]/90"
          >
            <UserRoundPlus className="mr-2" />
            Add Employee
          </Button>
        </div>

        <div className="flex items-center py-4 justify-between">
          {isLoading ? (
            <SkeletonFilter />
          ) : (
            <div className="relative w-1/4">
              <Input
                placeholder="Search across all columns..."
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pr-10 placeholder:text-[#1c5e93]"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          )}

          <div className="flex items-center space-x-2">
            {isAnyFilterApplied && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            )}

            {isLoading ? (
              <SkeletonColumnsButton />
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="ml-auto bg-[#1c5e93] text-white hover:bg-[#1c5e93]/90 border-[#1c5e93]"
                  >
                    Columns <ChevronDown />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => {
                      return (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          className="capitalize"
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(!!value)
                          }
                        >
                          {column.id}
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable />
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id}>
                      {headerGroup.headers.map((header) => {
                        return (
                          <TableHead
                            key={header.id}
                            className="bg-[#1c5e93] text-white border border-[#1c5e93]"
                          >
                            {header.isPlaceholder ? null : (
                              <div className="flex flex-col items-start justify-between">
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {/* Render Filter UI */}
                                {header.column.columnDef.filterType && (
                                  <div className="mt-2">
                                    {header.column.columnDef.filterType ===
                                      "select" && (
                                      <SelectFilter
                                        column={header.column}
                                        options={
                                          header.column.id === "client"
                                            ? clientOptions
                                            : header.column.id === "vendor"
                                            ? vendorOptions
                                            : designationOptions
                                        }
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </TableHead>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows?.length ? (
                    table.getRowModel().rows.map((row, index) => (
                      <TableRow
                        key={row.id}
                        data-state={row.getIsSelected() && "selected"}
                        className={
                          index % 2 === 0 ? "bg-white" : "bg-[#6fd3f2]"
                        }
                      >
                        {row.getVisibleCells().map((cell) => {
                          let cellValue = flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          );

                          return (
                            <TableCell
                              key={cell.id}
                              className="border border-[#1c5e93]"
                            >
                              {cellValue}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={columns.length}
                        className="h-24 text-center"
                      >
                        No results.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-end space-x-2 py-4">
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
