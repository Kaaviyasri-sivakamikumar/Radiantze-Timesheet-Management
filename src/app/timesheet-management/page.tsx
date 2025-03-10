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
import {
  Building2,
  CalendarCheck,
  CalendarRange,
  IdCard,
  PlusCircle,
  Trash2,
  TreePalm,
  User,
  UserRoundPlus,
} from "lucide-react";
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
import { convertDateToSpecificFormat } from "@/lib/utils";
import WeekSelector from "./WeekSelector";
import WeekSelect from "../../components/timesheet/WeekSelect";
import useWeekSelect from "@/hooks/timesheet/useWeekSelect";
import {
  getCurrentWeekRange,
  getDatesBetweenRange,
  getYearMonth,
} from "@/lib/timesheet/utils";

const ICON_SIZE = 18;

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
  ],
};

const allowedTimeNames = [
  "Regular",
  "Overtime",
  "Paid time off",
];

const timeColors = {
  Regular: "blue",
  Overtime: "pink",
  "Paid time off": "orange",
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
  const { start, end } = getCurrentWeekRange();
  console.log(start, end);
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(start);
  const [selectedWeekEndDate, setSelectedWeekEndDate] = useState(end);
  const handleWeekChange = (
    selectedWeekStartDate: string,
    selectedweekEndDate: string
  ) => {
    setSelectedWeekStartDate(selectedWeekStartDate);
    setSelectedWeekEndDate(selectedweekEndDate);
  };

  // const [weekStartDate, setWeekStartDate] = useState(
  //   format(startOfWeek(selectedWeek), "MMM dd")
  // );
  // const [weekEndDate, setWeekEndDate] = useState(
  //   format(endOfWeek(selectedWeek), "MMM dd")
  // );
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
    const { year, month } = getYearMonth(selectedWeekStartDate);
    fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);
    console.log(selectedWeekStartDate);

    // Ensure Monday is the start of the week
    const weekDays = getDatesBetweenRange(
      selectedWeekStartDate,
      selectedWeekEndDate
    );

    console.log(weekDays);
    setDayLabels(
      weekDays.map((day) => {
        console.log(day); // Logs each date object
        return format(day, "EEE, MMM dd");
      })
    );
  }, [selectedWeekStartDate]);

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
          <h2 className="text-3xl font-bold mt-2 font-inria">
            Timesheet Submissions
          </h2>
          {/* <h4 className="mt-2">
            {selectedWeekStartDate} - {selectedWeekEndDate}
          </h4> */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-3 mt-4 bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-lg transition duration-200 cursor-pointer">
                <CalendarRange className="w-5 h-5 text-gray-600" />
                <p className="text-gray-700 text-sm font-medium">
                  {start === selectedWeekStartDate
                    ? `This week ${selectedWeekStartDate} - ${selectedWeekEndDate}`
                    : `${selectedWeekStartDate} - ${selectedWeekEndDate}`}
                </p>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80">
              {/* <WeekSelector></WeekSelector> */}
              <WeekSelect
                onChange={handleWeekChange}
                onClose={() => setIsDropdownOpen(false)}
              ></WeekSelect>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="flex items-center gap-4">
          {/* Week Selection Dropdown with Calendar */}
          {/* <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-3 bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-lg transition duration-200 cursor-pointer">
                <CalendarRange className="w-5 h-5 text-gray-600" />
                <p className="text-gray-700 text-sm font-medium">
                  {start === selectedWeekStartDate
                    ? "This week"
                    : `${selectedWeekStartDate} - ${selectedWeekEndDate}`}
                </p>
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="w-80">
              <WeekSelect
                onChange={handleWeekChange}
                onClose={() => setIsDropdownOpen(false)}
              ></WeekSelect>
            </DropdownMenuContent>
          </DropdownMenu> */}

          {/* User Info Box (Replace with actual data) */}
          <div className="w-[350px] bg-white shadow-sm rounded-md p-4 border border-gray-200">
            <div className="space-y-3 text-gray-700 text-sm">
              <div className="flex items-center gap-3">
                <User size={20} className="text-gray-500" />
                <span className="font-medium">Kaaviya</span>
              </div>
              <div className="flex items-center gap-3">
                <IdCard size={20} className="text-gray-500" />
                <span className="text-gray-600">
                  Employee ID: <span className="font-medium">123</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Building2 size={20} className="text-gray-500" />
                <span className="text-gray-600">
                  Client: <span className="font-medium">SomeCompany</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CalendarCheck size={20} className="text-gray-500" />
                <span className="text-gray-600">
                  Start Date: <span className="font-medium">01/01/2000</span>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <TreePalm size={20} className="text-gray-500" />
                <span className="text-gray-600">
                  Available Leave: <span className="font-medium">0hrs</span>
                </span>
              </div>
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
