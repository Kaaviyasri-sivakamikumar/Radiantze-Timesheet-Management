"use client";

import React from "react";
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
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  UserRoundPlus,
  Search, // Import the Search icon
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/Input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const data: EmployeeData[] = [
  {
    employeeId: "1",
    client: "Google",
    designation: "Software Engineer",
    email: "john.doe@example.com",
    firstName: "John",
    lastName: "Doe",
    vendor: "ABC",
    startDate: "01/02/2015",
  },
  {
    employeeId: "2",
    client: "Microsoft",
    designation: "Data Analyst",
    email: "jane.smith@example.com",
    firstName: "Jane",
    lastName: "Smith",
    vendor: "XYZ",
    startDate: "02/14/2016",
  },
  {
    employeeId: "3",
    client: "Amazon",
    designation: "Product Manager",
    email: "will.johnson@example.com",
    firstName: "Will",
    lastName: "Johnson",
    vendor: "LMN",
    startDate: "03/21/2017",
  },
  {
    employeeId: "4",
    client: "Facebook",
    designation: "UX Designer",
    email: "susan.white@example.com",
    firstName: "Susan",
    lastName: "White",
    vendor: "XYZ",
    startDate: "05/30/2018",
  },
  {
    employeeId: "5",
    client: "Apple",
    designation: "Software Engineer",
    email: "bob.brown@example.com",
    firstName: "Bob",
    lastName: "Brown",
    vendor: "ABC",
    startDate: "06/25/2019",
  },
  {
    employeeId: "6",
    client: "Google",
    designation: "Quality Analyst",
    email: "alice.miller@example.com",
    firstName: "Alice",
    lastName: "Miller",
    vendor: "XYZ",
    startDate: "07/13/2020",
  },
  {
    employeeId: "7",
    client: "Microsoft",
    designation: "DevOps Engineer",
    email: "mike.jones@example.com",
    firstName: "Mike",
    lastName: "Jones",
    vendor: "LMN",
    startDate: "08/30/2021",
  },
  {
    employeeId: "8",
    client: "Amazon",
    designation: "Full Stack Developer",
    email: "katie.clark@example.com",
    firstName: "Katie",
    lastName: "Clark",
    vendor: "ABC",
    startDate: "09/12/2022",
  },
  {
    employeeId: "9",
    client: "Facebook",
    designation: "Security Engineer",
    email: "chris.lewis@example.com",
    firstName: "Chris",
    lastName: "Lewis",
    vendor: "XYZ",
    startDate: "10/10/2023",
  },
  {
    employeeId: "10",
    client: "Apple",
    designation: "Network Engineer",
    email: "nina.harris@example.com",
    firstName: "Nina",
    lastName: "Harris",
    vendor: "LMN",
    startDate: "11/03/2020",
  },
  {
    employeeId: "11",
    client: "Google",
    designation: "Cloud Architect",
    email: "peter.garcia@example.com",
    firstName: "Peter",
    lastName: "Garcia",
    vendor: "ABC",
    startDate: "12/19/2019",
  },
  {
    employeeId: "12",
    client: "Microsoft",
    designation: "Business Analyst",
    email: "laura.rodriguez@example.com",
    firstName: "Laura",
    lastName: "Rodriguez",
    vendor: "XYZ",
    startDate: "01/10/2018",
  },
  {
    employeeId: "13",
    client: "Amazon",
    designation: "Database Administrator",
    email: "ryan.martin@example.com",
    firstName: "Ryan",
    lastName: "Martin",
    vendor: "LMN",
    startDate: "02/05/2021",
  },
  {
    employeeId: "14",
    client: "Facebook",
    designation: "Web Developer",
    email: "emma.davis@example.com",
    firstName: "Emma",
    lastName: "Davis",
    vendor: "ABC",
    startDate: "03/25/2022",
  },
  {
    employeeId: "15",
    client: "Apple",
    designation: "Mobile App Developer",
    email: "jacob.moore@example.com",
    firstName: "Jacob",
    lastName: "Moore",
    vendor: "XYZ",
    startDate: "04/17/2020",
  },
  {
    employeeId: "16",
    client: "Google",
    designation: "AI Engineer",
    email: "maria.james@example.com",
    firstName: "Maria",
    lastName: "James",
    vendor: "LMN",
    startDate: "05/09/2021",
  },
  {
    employeeId: "17",
    client: "Microsoft",
    designation: "Operations Manager",
    email: "daniel.wilson@example.com",
    firstName: "Daniel",
    lastName: "Wilson",
    vendor: "ABC",
    startDate: "06/22/2019",
  },
  {
    employeeId: "18",
    client: "Amazon",
    designation: "Solutions Architect",
    email: "olivia.martinez@example.com",
    firstName: "Olivia",
    lastName: "Martinez",
    vendor: "XYZ",
    startDate: "07/03/2018",
  },
  {
    employeeId: "19",
    client: "Facebook",
    designation: "Data Scientist",
    email: "lucas.gonzalez@example.com",
    firstName: "Lucas",
    lastName: "Gonzalez",
    vendor: "LMN",
    startDate: "08/15/2021",
  },
  {
    employeeId: "20",
    client: "Apple",
    designation: "Software Developer",
    email: "claire.robinson@example.com",
    firstName: "Claire",
    lastName: "Robinson",
    vendor: "ABC",
    startDate: "09/27/2019",
  },
  {
    employeeId: "21",
    client: "Google",
    designation: "Front End Developer",
    email: "jackson.lee@example.com",
    firstName: "Jackson",
    lastName: "Lee",
    vendor: "XYZ",
    startDate: "10/14/2022",
  },
  {
    employeeId: "22",
    client: "Microsoft",
    designation: "Product Designer",
    email: "zoe.king@example.com",
    firstName: "Zoe",
    lastName: "King",
    vendor: "LMN",
    startDate: "11/23/2017",
  },
  {
    employeeId: "23",
    client: "Amazon",
    designation: "Backend Developer",
    email: "adam.green@example.com",
    firstName: "Adam",
    lastName: "Green",
    vendor: "ABC",
    startDate: "12/30/2020",
  },
  {
    employeeId: "24",
    client: "Facebook",
    designation: "System Administrator",
    email: "mia.scott@example.com",
    firstName: "Mia",
    lastName: "Scott",
    vendor: "XYZ",
    startDate: "01/18/2021",
  },
  {
    employeeId: "25",
    client: "Apple",
    designation: "Project Manager",
    email: "ethan.hernandez@example.com",
    firstName: "Ethan",
    lastName: "Hernandez",
    vendor: "LMN",
    startDate: "02/07/2022",
  },
  {
    employeeId: "26",
    client: "Google",
    designation: "Technical Writer",
    email: "sophia.morris@example.com",
    firstName: "Sophia",
    lastName: "Morris",
    vendor: "ABC",
    startDate: "03/11/2019",
  },
  {
    employeeId: "27",
    client: "Microsoft",
    designation: "Cloud Engineer",
    email: "henry.williams@example.com",
    firstName: "Henry",
    lastName: "Williams",
    vendor: "XYZ",
    startDate: "04/02/2020",
  },
  {
    employeeId: "28",
    client: "Amazon",
    designation: "Mobile Engineer",
    email: "isabella.jenkins@example.com",
    firstName: "Isabella",
    lastName: "Jenkins",
    vendor: "LMN",
    startDate: "05/16/2021",
  },
  {
    employeeId: "29",
    client: "Facebook",
    designation: "Marketing Manager",
    email: "lily.carter@example.com",
    firstName: "Lily",
    lastName: "Carter",
    vendor: "ABC",
    startDate: "06/05/2022",
  },
  {
    employeeId: "30",
    client: "Apple",
    designation: "Research Analyst",
    email: "charlotte.perez@example.com",
    firstName: "damn",
    lastName: "KK",
    vendor: "XYZ",
    startDate: "07/12/2023",
  },
];

export type EmployeeData = {
  employeeId: string;
  client: string;
  designation: string;
  email: string;
  firstName: string;
  lastName: string;
  vendor: string;
  startDate: string;
};

export const columns: ColumnDef<EmployeeData>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "employeeId",
    header: "Employee ID",
    cell: ({ row }) => <div>{row.getValue("employeeId")}</div>,
  },
  {
    accessorKey: "firstName",
    header: "First Name",
    cell: ({ row }) => <div>{row.getValue("firstName")}</div>,
  },
  {
    accessorKey: "lastName",
    header: "Last Name",
    cell: ({ row }) => <div>{row.getValue("lastName")}</div>,
  },
  {
    accessorKey: "client",
    header: "Client",
    cell: ({ row }) => <div>{row.getValue("client")}</div>,
  },
  {
    accessorKey: "designation",
    header: "Designation",
    cell: ({ row }) => <div>{row.getValue("designation")}</div>,
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Email
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div className="lowercase">{row.getValue("email")}</div>,
  },
  {
    accessorKey: "vendor",
    header: "Vendor",
    cell: ({ row }) => <div>{row.getValue("vendor")}</div>,
  },
  {
    accessorKey: "startDate",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Start Date
        <ArrowUpDown />
      </Button>
    ),
    cell: ({ row }) => <div>{row.getValue("startDate")}</div>,
    sortingFn: (rowA, rowB, columnId) => {
      const dateA = new Date(rowA.getValue(columnId) as string);
      const dateB = new Date(rowB.getValue(columnId) as string);
      return dateA.getTime() - dateB.getTime();
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const employee = row.original;

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
            <DropdownMenuItem>View employee</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];

export default function UserManagement() {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");  // Global filter state
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
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
      globalFilter, // Include global filter in the state
    },
    globalFilterFn: (row, columnId, filterValue) => { // Custom filter function
      const employee = row.original;
      const searchTerm = filterValue.toLowerCase();

      const fullName = `${employee.firstName} ${employee.lastName}`.toLowerCase();

      return (
        employee.email.toLowerCase().includes(searchTerm) ||
        employee.firstName.toLowerCase().includes(searchTerm) ||
        employee.lastName.toLowerCase().includes(searchTerm) ||
        fullName.includes(searchTerm)

      );
    },
    onGlobalFilterChange: setGlobalFilter, // Update the global filter state
  });

  const router = useRouter();

  const handleAddUser = () => {
    router.push("/employee-management/profile");
  };

  return (
    <div className="ml-7 relative mr-7">
      <div className="w-full bg-white rounded-lg pb-32">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Employee Management
          </h1>

          <Button onClick={handleAddUser}>
            <UserRoundPlus className="mr-2" />
            Add User
          </Button>
        </div>
        <div className="flex items-center py-4">
          <div className="relative">
            <Input
              placeholder="Search name or email..."
              value={globalFilter ?? ""}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="pr-10" // Add padding to accommodate the search icon
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <Search className="h-4 w-4 text-muted-foreground" /> {/* Search Icon */}
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="ml-auto">
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
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
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
          <div className="flex-1 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length} of{" "}
            {table.getFilteredRowModel().rows.length} row(s) selected.
          </div>
          <div className="space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}