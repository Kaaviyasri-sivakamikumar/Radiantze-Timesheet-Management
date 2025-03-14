"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
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
  ChevronDown,
  ChevronUp,
  IdCard,
  PlusCircle,
  SaveAllIcon,
  Trash2,
  TreePalm,
  User,
} from "lucide-react";
import { Circle } from "lucide-react";
import { format } from "date-fns";
import {
  getCurrentWeekRange,
  getDatesBetweenRange,
  getYearMonth,
} from "@/lib/timesheet/utils";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import WeekSelect from "@/components/timesheet/WeekSelect";

const ICON_SIZE = 18;

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

const allowedTimeNames = ["Regular", "Overtime", "Paid time off"];

const timeColors = {
  Regular: "blue",
  Overtime: "pink",
  "Paid time off": "orange",
};

const TimeName = ({ name }: { name: string }) => {
  const color = (timeColors as Record<string, string>)[name] || "gray";
  return (
    <div className="flex items-center gap-2">
      <Circle size={8} color={color} fill={color} />
      {name}
    </div>
  );
};

interface TimesheetApiResponse {
  success: boolean;
  employeeId: string;
  weekStartDate: string;
  year: string;
  month: string;
  timesheet: {
    format: string;
    [date: string]: {
      hoursWorked: number;
      tasks: {
        taskCode: string;
        taskName: string;
        hours: number;
      }[];
    };
  };
  totalHours: number;
  format: string;
  activityLog: any[];
}

const TimesheetManagement = () => {
  const [data, setData] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExistingTimesheet, setIsExistingTimesheet] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const { start, end } = getCurrentWeekRange();
  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(start);
  const [selectedWeekEndDate, setSelectedWeekEndDate] = useState(end);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dayLabels, setDayLabels] = useState<string[]>([]);
  const initialDataRef = useRef<TimesheetEntry | null>(null);
  const { toast } = useToast();

  const handleWeekChange = (newStartDate: string, newEndDate: string) => {
    setSelectedWeekStartDate(newStartDate);
    setSelectedWeekEndDate(newEndDate);
  };

  const fetchWeeklyTimesheetData = useCallback(
    (year: string, month: string, weekstartDate: string) => {
      const data = {
        weekStartDate: weekstartDate,
        month: month,
        year: year,
      };
      setLoading(true);
      service
        .fetchWeekTimesheet(data)
        .then((response: { data: TimesheetApiResponse }) => {
          console.log("API Response:", response.data);
          if (response.data.success) {
            const transformedData = transformApiResponseToTimesheetEntry(
              response.data
            );
            setData(transformedData);
            initialDataRef.current = transformedData;
            setIsExistingTimesheet(true);
            setHasChanges(false);
          } else {
            toast({
              title: "Timesheet information not found",
              description:
                "Timesheet information does not exist in the records",
              variant: "destructive",
            });
            const emptyTimesheet = createEmptyTimesheet();
            setData(emptyTimesheet);
            initialDataRef.current = emptyTimesheet;
            setIsExistingTimesheet(false);
            setHasChanges(false);
          }
        })
        .catch((error: any) => {
          console.error("Error fetching timesheet:", error);
          toast({
            title: "Error fetching timesheet data",
            description:
              error?.response?.data?.message ||
              "Failed to retrieve timesheet data.",
            variant: "destructive",
          });
          const emptyTimesheet = createEmptyTimesheet();
          setData(emptyTimesheet);
          initialDataRef.current = emptyTimesheet;
          setIsExistingTimesheet(false);
          setHasChanges(false);
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [toast]
  );

  const saveOrUpdateWeeklyTimesheetData = useCallback(
    (request: any) => {
      setLoading(true);
      return service
        .saveAndUpdateWeekTimesheet(request)
        .then((response: any) => {
          console.log("API Response (Save/Update):", response.data);
          toast({
            title: "Timesheet saved successfully!",
          });
          const { year, month } = getYearMonth(selectedWeekStartDate);
          fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);
          setHasChanges(false);
        })
        .catch((error: any) => {
          console.error("Error saving timesheet:", error);
          toast({
            title: "Error saving timesheet data",
            description:
              error?.response?.data?.message ||
              "Failed to save timesheet data.",
            variant: "destructive",
          });
        })
        .finally(() => {
          setLoading(false);
        });
    },
    [fetchWeeklyTimesheetData, selectedWeekStartDate, toast]
  );

  useEffect(() => {
    const { year, month } = getYearMonth(selectedWeekStartDate);
    fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);

    const weekDays = getDatesBetweenRange(
      selectedWeekStartDate,
      selectedWeekEndDate
    );

    setDayLabels(weekDays.map((day) => format(day, "EEE, MMM dd")));
  }, [selectedWeekStartDate, selectedWeekEndDate, fetchWeeklyTimesheetData]);

  const createEmptyTimesheet = (): TimesheetEntry => ({
    id: 0,
    name: "Kaaviya",
    employeeId: 123,
    client: "SomeCompany",
    startDate: "01/01/2000",
    availableLeave: "0hrs",
    leaveTaken: "08hrs",
    totalWork: "0hrs",
    times: [],
  });

  const handleAddRow = useCallback((timeName: string) => {
    setData((prevData) => {
      const newData = prevData ? { ...prevData } : createEmptyTimesheet();

      setHasChanges(true);
      return {
        ...newData,
        times: [
          ...newData.times,
          {
            name: timeName,
            mon: 0,
            tue: 0,
            wed: 0,
            thu: 0,
            fri: 0,
            sat: 0,
            sun: 0,
            total: 0,
          },
        ],
      };
    });
  }, []);

  const handleDeleteRow = useCallback((indexToDelete: number) => {
    setData((prevData) => {
      if (!prevData) return null;
      const updatedTimes = prevData.times.filter(
        (_, index) => index !== indexToDelete
      );
      setHasChanges(true);
      return {
        ...prevData,
        times: updatedTimes,
      };
    });
  }, []);

  const handleInputChange = useCallback(
    (index: number, day: string, value: number) => {
      setData((prevData) => {
        if (!prevData) return null;

        const updatedTimes = [...prevData.times];
        updatedTimes[index][day] = value;
        updatedTimes[index].total =
          updatedTimes[index].mon +
          updatedTimes[index].tue +
          updatedTimes[index].wed +
          updatedTimes[index].thu +
          updatedTimes[index].fri +
          updatedTimes[index].sat +
          updatedTimes[index].sun;

        setHasChanges(true);
        return { ...prevData, times: updatedTimes };
      });
    },
    []
  );

  const transformApiResponseToTimesheetEntry = (
    response: TimesheetApiResponse
  ): TimesheetEntry => {
    const { timesheet } = response;
    const weekDays = getDatesBetweenRange(
      response.weekStartDate,
      selectedWeekEndDate
    );
    const dayKeys = weekDays.map((day) => format(day, "yyyy-MM-dd"));

    const times: Time[] = [];
    const taskHoursMap: { [taskName: string]: { [day: string]: number } } = {};

    dayKeys.forEach((day) => {
      if (timesheet[day]) {
        timesheet[day].tasks.forEach((task) => {
          if (!taskHoursMap[task.taskName]) {
            taskHoursMap[task.taskName] = {};
          }
          taskHoursMap[task.taskName][day] = task.hours;
        });
      }
    });

    Object.entries(taskHoursMap).forEach(([taskName, dayHours]) => {
      const timeEntry: Time = {
        name: taskName,
        mon: dayHours[dayKeys[0]] || 0,
        tue: dayHours[dayKeys[1]] || 0,
        wed: dayHours[dayKeys[2]] || 0,
        thu: dayHours[dayKeys[3]] || 0,
        fri: dayHours[dayKeys[4]] || 0,
        sat: dayHours[dayKeys[5]] || 0,
        sun: dayHours[dayKeys[6]] || 0,
        total: 0,
      };
      timeEntry.total =
        timeEntry.mon +
        timeEntry.tue +
        timeEntry.wed +
        timeEntry.thu +
        timeEntry.fri +
        timeEntry.sat +
        timeEntry.sun;
      times.push(timeEntry);
    });

    const transformed: TimesheetEntry = {
      id: 1,
      name: "Kaaviya",
      employeeId: 123,
      client: "SomeCompany",
      startDate: "01/01/2000",
      availableLeave: "0hrs",
      leaveTaken: "08hrs",
      totalWork: response.totalHours.toString() + "hrs",
      times: times,
    };

    return transformed;
  };

  const totalRow = data
    ? {
        name: "Total",
        mon: data.times.reduce((sum, p) => sum + p.mon, 0),
        tue: data.times.reduce((sum, p) => sum + p.tue, 0),
        wed: data.times.reduce((sum, p) => sum + p.wed, 0),
        thu: data.times.reduce((sum, p) => sum + p.thu, 0),
        fri: data.times.reduce((sum, p) => sum + p.fri, 0),
        sat: data.times.reduce((sum, p) => sum + p.sat, 0),
        sun: data.times.reduce((sum, p) => sum + p.sun, 0),
        total: data.times.reduce((sum, p) => sum + p.total, 0),
      }
    : null;

  const handleSave = () => {
    if (!data) {
      toast({
        title: "No data to save!",
        description: "Please add time entries before saving.",
        variant: "destructive",
      });
      return;
    }
    if (!data.times) {
      toast({
        title: "No time entries to save!",
        description: "Please add time entries before saving.",
        variant: "destructive",
      });
      return;
    }

    const weekDays = getDatesBetweenRange(
      selectedWeekStartDate,
      selectedWeekEndDate
    );
    const dayKeys = weekDays.map((day) => format(day, "yyyy-MM-dd"));

    const timesheetData: {
      [date: string]: {
        hoursWorked: number;
        tasks: { taskCode: string; taskName: string; hours: number }[];
      };
    } = {};

    let totalHours = 0;
    dayKeys.forEach((day, dayIndex) => {
      timesheetData[day] = {
        hoursWorked: 0,
        tasks: [],
      };

      data.times.forEach((timeEntry) => {
        let hours: number;
        switch (dayIndex) {
          case 0:
            hours = timeEntry.mon;
            break;
          case 1:
            hours = timeEntry.tue;
            break;
          case 2:
            hours = timeEntry.wed;
            break;
          case 3:
            hours = timeEntry.thu;
            break;
          case 4:
            hours = timeEntry.fri;
            break;
          case 5:
            hours = timeEntry.sat;
            break;
          case 6:
            hours = timeEntry.sun;
            break;
          default:
            hours = 0;
        }
        if (hours > 0) {
          timesheetData[day].hoursWorked += hours;
          timesheetData[day].tasks.push({
            taskCode: timeEntry.name.toLowerCase().replace(/ /g, "_"), // Generate a simple task code based on the name
            taskName: timeEntry.name,
            hours: hours,
          });
        }
      });
      totalHours += timesheetData[day].hoursWorked;
    });

    const request = {
      year: getYearMonth(selectedWeekStartDate).year,
      month: getYearMonth(selectedWeekStartDate).month,
      weekStartDate: selectedWeekStartDate,
      timesheet: {
        ...timesheetData,
        totalHours: totalHours,
        format: "YYYY-MM-DD",
      },
    };

    console.log("Save Request:", request);
    saveOrUpdateWeeklyTimesheetData(request);
  };

  const isSaveButtonEnabled = hasChanges && data;

  const availableTimeNames = useMemo(() => {
    if (!data) return allowedTimeNames;

    // Get the names of the tasks already added
    const addedTimeNames = data.times.map((time) => time.name);

    // Filter out the already added task names from the allowedTimeNames
    return allowedTimeNames.filter(
      (timeName) => !addedTimeNames.includes(timeName)
    );
  }, [data]);

  return (
    <div className="container mx-auto p-4">
      {/* Top Section */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-3xl font-bold mt-2 font-inria">
            Timesheet Submissions
          </h2>
          {/* Week Selection Dropdown with Calendar */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center gap-2 p-3 mt-4 bg-white rounded-md shadow-sm border border-gray-200 hover:shadow-lg transition duration-200 cursor-pointer">
                <CalendarRange className="w-5 h-5 text-gray-600" />
                <p className="text-gray-700 text-sm font-medium">
                  {start === selectedWeekStartDate
                    ? `This week ${selectedWeekStartDate} - ${selectedWeekEndDate}`
                    : `${selectedWeekStartDate} - ${selectedWeekEndDate}`}
                </p>
                <div className="flex flex-col ml-8">
                  <ChevronUp className="w-3 h-3" />
                  <ChevronDown className="w-3 h-3 " />
                </div>
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
            {loading ? (
              // Display skeleton rows while loading
              Array.from({ length: 3 }).map((_, index) => (
                <TableRow key={`skeleton-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-[150px]" />
                  </TableCell>
                  {dayLabels.map((_, dayIndex) => (
                    <TableCell key={`skeleton-day-${dayIndex}`}>
                      <Skeleton className="h-8 w-20" />
                    </TableCell>
                  ))}
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-10 ml-auto" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8" />
                  </TableCell>
                </TableRow>
              ))
            ) : data ? (
              // Display data if available
              data.times.length > 0 ? (
                data.times.map((time, index) => (
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
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={9} className="text-center">
                    No time entries found. Add a new row to start.
                  </TableCell>
                </TableRow>
              )
            ) : (
              // Display a message when data is null (shouldn't happen with the fix)
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No timesheet data found for the selected week.
                </TableCell>
              </TableRow>
            )}
            {totalRow && data && data.times.length > 0 && (
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
            )}
          </TableBody>
        </Table>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between mt-4">
        {/* Add Row Button */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={availableTimeNames.length === 0}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add new row
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56">
            <DropdownMenuLabel>Select Time</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {availableTimeNames.length > 0 ? (
              availableTimeNames.map((timeName) => (
                <DropdownMenuItem
                  key={timeName}
                  onSelect={() => handleAddRow(timeName)}
                >
                  <TimeName name={timeName} />
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No Assigned Task</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save/Update Button */}
        {data &&
          (isSaveButtonEnabled || loading) && ( // Only show the button when data is available
            <Button
              onClick={handleSave}
              disabled={!isSaveButtonEnabled || loading} // Disable based on hasChanges and loading
            >
              <SaveAllIcon className="mr-2" />
              {loading ? "Saving..." : isExistingTimesheet ? "Update" : "Save"}
            </Button>
          )}
      </div>
    </div>
  );
};

export default TimesheetManagement;
