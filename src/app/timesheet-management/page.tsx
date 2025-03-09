"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2, UserRoundPlus } from "lucide-react";
import { Circle } from "lucide-react";
import {
  startOfWeek,
  endOfWeek,
  format,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  addMonths,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { service } from "@/services/service";
import { toast } from "@/hooks/use-toast";

// Mock data interface
interface Time {
  name: string;
  mon: number;
  tue: number;
  wed: number;
  thu: number;
  fri: number;
  sat: number;
  sun: number;
  total: number;
}

interface TimesheetEntry {
  id: number;
  name: string;
  employeeId: number;
  client: string;
  startDate: string;
  availableLeave: string;
  leaveTaken: string;
  totalWork: string;
  times: Time[];
}

const mockData: TimesheetEntry = {
  id: 1,
  name: "Kaaviya",
  employeeId: 123,
  client: "SomeCompany",
  startDate: "01/01/2000",
  availableLeave: "0hrs",
  leaveTaken: "08hrs",
  totalWork: "96hrs",
  times: [
    {
      name: "Regular",
      mon: 8,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 8,
    },
    {
      name: "Overtime",
      mon: 0,
      tue: 4,
      wed: 4,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 8,
    },
    {
      name: "Paid time off",
      mon: 0,
      tue: 0,
      wed: 2.3,
      thu: 6,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 8.3,
    },
    {
      name: "Unpaid time off",
      mon: 0,
      tue: 0.3,
      wed: 0.3,
      thu: 0.3,
      fri: 0.3,
      sat: 0,
      sun: 0,
      total: 4,
    },
  ],
};

const allowedTimeNames = [
  "Regular",
  "Overtime",
  "Paid time off",
  "Unpaid time off",
];

const timeColors = {
  Regular: "blue",
  Overtime: "pink",
  "Paid time off": "orange",
  "Unpaid time off": "gray",
};

const TimeName = ({ name }: { name: string }) => {
  const color = timeColors[name] || "gray"; // Default to gray if color is not defined
  return (
    <div className="flex items-center gap-2">
      <Circle size={8} color={color} fill={color} />
      {name}
    </div>
  );
};

const TimesheetManagement = () => {
  const [data, setData] = useState<TimesheetEntry>(mockData); // Initialize with mockData
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(
    format(startOfWeek(selectedWeek), "MMM dd")
  );
  const [weekEndDate, setWeekEndDate] = useState(
    format(endOfWeek(selectedWeek), "MMM dd")
  );
  const [calendarDate, setCalendarDate] = useState<Date | undefined>(
    new Date()
  );
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dayLabels, setDayLabels] = useState<string[]>([]);

  const fetchWeeklyTimesheetData = (
    year: string,
    month: string,
    weekstartDate: string
  ) => {
    const data = {
      weekStartDate: weekstartDate,
      month: month,
      year: year,
    };
    return service
      .fetchWeekTimesheet(data)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        toast({
          title: "Timesheet information not found",
          description: "Timesheet information does not exisits in the records",
          variant: "destructive",
        });
      })
      .finally(() => {
        // setIsLoading(false); // Set loading state to false
      });
  };

  useEffect(() => {
    fetchWeeklyTimesheetData("2025", "03", "2025-03-10");
    setWeekStartDate(format(startOfWeek(selectedWeek), "MMM dd"));
    setWeekEndDate(format(endOfWeek(selectedWeek), "MMM dd"));

    // Update day labels based on selected week
    const weekDays = eachDayOfInterval({
      start: startOfWeek(selectedWeek),
      end: endOfWeek(selectedWeek),
    });
    setDayLabels(weekDays.map((day) => format(day, "Mo, MMM dd")));
  }, [selectedWeek]);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const start = startOfWeek(date);
      setCalendarDate(date);
      setSelectedWeek(start);
      setIsDropdownOpen(false); // Close the dropdown after selection
    }
  };

  // Function to add a new row
  const handleAddRow = (timeName: string) => {
    const newTime: Time = {
      name: timeName,
      mon: 0,
      tue: 0,
      wed: 0,
      thu: 0,
      fri: 0,
      sat: 0,
      sun: 0,
      total: 0,
    };

    setData({
      ...data,
      times: [...data.times, newTime],
    });
  };

  // Function to delete a row
  const handleDeleteRow = (indexToDelete: number) => {
    setData({
      ...data,
      times: data.times.filter((_, index) => index !== indexToDelete),
    });
  };

  const handleInputChange = (index: number, day: string, value: number) => {
    const updatedTimes = [...data.times];
    updatedTimes[index][day] = value;
    updatedTimes[index].total =
      updatedTimes[index].mon +
      updatedTimes[index].tue +
      updatedTimes[index].wed +
      updatedTimes[index].thu +
      updatedTimes[index].fri +
      updatedTimes[index].sat +
      updatedTimes[index].sun;
    setData({ ...data, times: updatedTimes });
  };

  const totalRow = {
    name: "Total",
    mon: data.times.reduce((sum, p) => sum + p.mon, 0),
    tue: data.times.reduce((sum, p) => sum + p.tue, 0),
    wed: data.times.reduce((sum, p) => sum + p.wed, 0),
    thu: data.times.reduce((sum, p) => sum + p.thu, 0),
    fri: data.times.reduce((sum, p) => sum + p.fri, 0),
    sat: data.times.reduce((sum, p) => sum + p.sat, 0),
    sun: data.times.reduce((sum, p) => sum + p.sun, 0),
    total: data.times.reduce((sum, p) => sum + p.total, 0),
  };

  return (
    <div className="container mx-auto p-4">
      {/* Top Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold mt-2">
            {weekStartDate} - {weekEndDate}
          </h1>
          <h2 className="text-3xl font-bold mt-2">Timesheet Submissions</h2>
        </div>
        <div className="flex items-center gap-4">
          {/* Week Selection Dropdown with Calendar */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Select Week</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80">
              <Calendar
                mode="single"
                selected={calendarDate}
                onSelect={handleSelect}
                className="rounded-md border"
                // to automatically select all days in week, this is what needs to be done
                defaultMonth={selectedWeek}
                disabledDays={{
                  after: addMonths(new Date(), 6),
                }}
                // this part is for auto filling week
                modifiers={{
                  highlighted: calendarDate
                    ? eachDayOfInterval({
                        start: startOfWeek(calendarDate),
                        end: endOfWeek(calendarDate),
                      })
                    : [],
                }}
                modifiersStyles={{
                  highlighted: {
                    backgroundColor: "hsl(var(--primary))",
                    color: "hsl(var(--primary-foreground))",
                  },
                }}
              />
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Info Box (Replace with actual data) */}
          <div className="border rounded p-2 w-[250px] text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <UserRoundPlus size={16} className="text-gray-400" />
              <span>Name: Kaaviya</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserRoundPlus size={16} className="text-gray-400" />
              <span>Employee ID: 123</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserRoundPlus size={16} className="text-gray-400" />
              <span>Client: SomeCompany</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserRoundPlus size={16} className="text-gray-400" />
              <span>Start Date: 01/01/2000</span>
            </div>
            <div className="flex items-center space-x-2">
              <UserRoundPlus size={16} className="text-gray-400" />
              <span>Available Leave: 0hrs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Timesheet Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Time</TableHead>
              {dayLabels.map((dayLabel) => (
                <TableHead key={dayLabel}>{dayLabel}</TableHead>
              ))}
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-[50px]"></TableHead>
              {/* Delete Column */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.times.map((time, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">
                  <TimeName name={time.name} />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.mon}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "mon",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.tue}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "tue",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.wed}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "wed",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.thu}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "thu",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.fri}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "fri",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.sat}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "sat",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    value={time.sun}
                    className="w-20"
                    onChange={(e) =>
                      handleInputChange(
                        index,
                        "sun",
                        parseFloat(e.target.value)
                      )
                    }
                  />
                </TableCell>
                <TableCell className="text-right">{time.total}</TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteRow(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className="font-medium">{totalRow.name}</TableCell>
              <TableCell>{totalRow.mon}</TableCell>
              <TableCell>{totalRow.tue}</TableCell>
              <TableCell>{totalRow.wed}</TableCell>
              <TableCell>{totalRow.thu}</TableCell>
              <TableCell>{totalRow.fri}</TableCell>
              <TableCell>{totalRow.sat}</TableCell>
              <TableCell>{totalRow.sun}</TableCell>
              <TableCell className="text-right">{totalRow.total}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* Combined Dropdown and Button */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="mt-2">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add new row
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56">
          <DropdownMenuLabel>Select Time</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {allowedTimeNames.map((timeName) => (
            <DropdownMenuItem
              key={timeName}
              onSelect={() => handleAddRow(timeName)}
            >
              <TimeName name={timeName} />
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default TimesheetManagement;