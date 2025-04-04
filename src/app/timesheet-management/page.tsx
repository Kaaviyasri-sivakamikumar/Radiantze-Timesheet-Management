"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  Suspense,
} from "react";
import { Input } from "@/components/ui/Input";
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
import { Button } from "@/components/ui/Button";
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
  Paperclip,
  XCircle,
  Download,
  Loader,
  Mail,
  Settings,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Circle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import {
  getCurrentWeekRange,
  getDatesBetweenRange,
  getYearMonth,
} from "@/lib/timesheet/utils";
import { useToast } from "@/hooks/use-toast";
import { service } from "@/services/service";
import WeekSelect from "@/components/timesheet/WeekSelect";
import { useRouter, useSearchParams } from "next/navigation"; // Import useRouter
import AttachmentsSection from "@/components/timesheet/AttachmentsSection";
import TimesheetTable from "@/components/timesheet/TimesheetTable";
import useTimesheetTable from "@/hooks/timesheet/useTimesheetTable";
import InfoRow from "@/components/InfoRow";

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
  attachments: Attachment[];
}

interface EmployeeInfo {
  firstName: string;
  lastName: string;
  email: string;
  designation: string;
  startDate: string;
  employeeId: string;
  clientName: string;
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
  attachments: Attachment[];
}

interface Attachment {
  fileName: string; // Changed from name to fileName
  attachmentId: string; // Changed from id to attachmentId
  uploadedBy: string;
  isUploadedByAdmin: boolean;
  fileSize: string;
}

const TimesheetManagementContent = () => {
  const [data, setData] = useState<TimesheetEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [isExistingTimesheet, setIsExistingTimesheet] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [initialStartDate, setInitialStartDate] = useState<Date>(new Date());
  const [uploading, setUploading] = useState(false);
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [employeeInfoLoading, setEmployeeInfoLoading] = useState(true); // Loading state for employee info
  const [downloadingAttachmentId, setDownloadingAttachmentId] = useState<
    string | null
  >(null);
  const [tempUploadingFileName, setTempUploadingFileName] = useState<
    string | null
  >(null);
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<
    string | null
  >(null);

  const searchParams = useSearchParams();
  const weekStartDateQueryParam = searchParams?.get("week-start");
  const { toast } = useToast();
  const router = useRouter(); // Initialize useRouter

  // const {handleAddRow } = useTimesheetTable(data,setHasChanges,setData);

  useEffect(() => {
    if (weekStartDateQueryParam) {
      const parsedDate = parseISO(weekStartDateQueryParam);
      if (isValid(parsedDate)) {
        setInitialStartDate(parsedDate);
      } else {
        toast({
          title: "Invalid Date",
          description: "The provided date is not valid.",
          variant: "destructive",
        });
      }
    } else {
      setInitialStartDate(new Date());
    }
  }, [weekStartDateQueryParam, toast]);

  const { start, end } = useMemo(
    () => getCurrentWeekRange(initialStartDate),
    [initialStartDate]
  );

  const [selectedWeekStartDate, setSelectedWeekStartDate] = useState(
    weekStartDateQueryParam != null
      ? isValid(parseISO(weekStartDateQueryParam))
        ? weekStartDateQueryParam
        : start
      : start
  );

  const [selectedWeekEndDate, setSelectedWeekEndDate] = useState(end);
  useEffect(() => {
    setSelectedWeekEndDate(end);
  }, [initialStartDate]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [dayLabels, setDayLabels] = useState<string[]>([]);
  const initialDataRef = useRef<TimesheetEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleWeekChange = (newStartDate: string, newEndDate: string) => {
    setSelectedWeekStartDate(newStartDate);
    setSelectedWeekEndDate(newEndDate);
  };

  useEffect(() => {
    // Update the URL whenever selectedWeekStartDate changes
    const newUrl = `?week-start=${selectedWeekStartDate}`;
    router.push(newUrl, { shallow: true }); // Use shallow routing to avoid full page reload
  }, [selectedWeekStartDate, router]);

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
          if (error?.response?.status == 404) {
            toast({
              title: "Timesheet information not found",
              description:
                error?.response?.data?.message ||
                "Failed to retrieve timesheet data.",
              variant: "default",
            });
          } else {
            toast({
              title: "Error fetching timesheet data",
              description:
                error?.response?.data?.message ||
                "Failed to retrieve timesheet data.",
              variant: "destructive",
            });
          }

          console.error("Error fetching timesheet:", error);

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

  const fetchEmployeeInfo = useCallback(() => {
    setEmployeeInfoLoading(true);
    service
      .getLoggedInEmployeeInfo()
      .then((response: { data }) => {
        console.log("Current Employee API Response:", response.data);
        setEmployeeInfo(response.data.response);
      })
      .catch((error: any) => {
        toast({
          title: "Error fetching employee information",
          description:
            error?.response?.data?.message ||
            "Failed to retrieve employee information.",
          variant: "destructive",
        });
        setEmployeeInfo(null);
      })
      .finally(() => {
        setEmployeeInfoLoading(false);
      });
  }, [toast]);

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

  const fetchAttachments = useCallback(() => {
    // No need to fetch separately, attachments are now part of the TimesheetEntry
  }, []);

  useEffect(() => {
    const { year, month } = getYearMonth(selectedWeekStartDate);
    fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);
    fetchEmployeeInfo();

    const weekDays = getDatesBetweenRange(
      selectedWeekStartDate,
      selectedWeekEndDate
    );

    setDayLabels(weekDays.map((day) => format(day, "EEE, MMM dd")));
  }, [
    selectedWeekStartDate,
    selectedWeekEndDate,
    fetchWeeklyTimesheetData,
    fetchEmployeeInfo,
  ]);

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
    attachments: [], // Initialize attachments as an empty array
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
    (index: number, day: string, value: string) => {
      setData((prevData) => {
        if (!prevData) return null;

        const parsedValue =
          value === "" ? 0 : Math.max(0, Math.min(24, Number(value)));

        if (isNaN(parsedValue)) {
          return prevData;
        }

        // Avoid unnecessary state updates
        if (prevData.times[index][day] === parsedValue) {
          return prevData;
        }

        const updatedTimes = [...prevData.times];
        updatedTimes[index] = {
          ...updatedTimes[index],
          [day]: parsedValue,
        };

        updatedTimes[index].total =
          updatedTimes[index].mon +
          updatedTimes[index].tue +
          updatedTimes[index].wed +
          updatedTimes[index].thu +
          updatedTimes[index].fri +
          updatedTimes[index].sat +
          updatedTimes[index].sun;

        const newData = { ...prevData, times: updatedTimes };

        const isChanged = !isTimesheetEqual(
          newData,
          initialDataRef.current as TimesheetEntry
        );
        setHasChanges(isChanged);

        return newData;
      });
    },
    []
  );

  const isTimesheetEqual = (a: TimesheetEntry, b: TimesheetEntry): boolean => {
    if (!a || !b) return false;
    if (a.times.length !== b.times.length) return false;

    return a.times.every((time, i) => {
      const compare = b.times[i];
      return (
        time.name === compare.name &&
        time.mon === compare.mon &&
        time.tue === compare.tue &&
        time.wed === compare.wed &&
        time.thu === compare.thu &&
        time.fri === compare.fri &&
        time.sat === compare.sat &&
        time.sun === compare.sun
      );
    });
  };

  const transformApiResponseToTimesheetEntry = (
    response: TimesheetApiResponse
  ): TimesheetEntry => {
    const { timesheet, attachments } = response;
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
      attachments: attachments ? attachments : [],
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

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "text/plain",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Only PDF, Text, and Excel files are allowed.",
        variant: "destructive",
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the file input
      }
      return;
    }

    if (data && data.attachments.length >= 5) {
      toast({
        title: "Maximum attachments reached",
        description: "You can only upload up to 5 files.",
        variant: "destructive",
      });
      return;
    }

    uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    setUploading(true);
    setTempUploadingFileName(file.name);

    const { year, month } = getYearMonth(selectedWeekStartDate);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("week-start", selectedWeekStartDate);
    formData.append("year", year);
    formData.append("month", month);

    try {
      const response = await service.uploadAttachment(formData);
      if (response.data.success) {
        toast({ title: "File uploaded successfully!" });
        fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);
      } else {
        toast({
          title: "File upload failed",
          description: response.data.message || "Failed to upload file.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "File upload failed",
        description: error?.response?.data?.message || "Failed to upload file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setTempUploadingFileName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeAttachment = async (attachmentId: string) => {
    setDeletingAttachmentId(attachmentId);
    const { year, month } = getYearMonth(selectedWeekStartDate);

    try {
      const response = await service.deleteAttachment(
        attachmentId,
        selectedWeekStartDate,
        year,
        month
      );
      if (response.data.success) {
        toast({ title: "Attachment removed successfully!" });
        fetchWeeklyTimesheetData(year, month, selectedWeekStartDate);
      } else {
        toast({
          title: "Failed to remove attachment",
          description:
            response.data.message || "Failed to remove the attachment.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error removing attachment:", error);
      toast({
        title: "Failed to remove attachment",
        description:
          error?.response?.data?.message || "Failed to remove the attachment.",
        variant: "destructive",
      });
    } finally {
      setDeletingAttachmentId(null);
    }
  };

  const downloadAttachment = async (attachmentId: string, fileName: string) => {
    setDownloadingAttachmentId(attachmentId);

    try {
      const response = await service.getAttachment(
        attachmentId,
        selectedWeekStartDate
      );

      if (response.data) {
        const blob = new Blob([response.data as any], {
          type: "application/pdf", // Use correct MIME type (pdf, image/png, etc.)
        });

        const url = window.URL.createObjectURL(blob);

        // Open in new tab
        window.open(url, "_blank");

        // Optional: revoke the object URL after a delay
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
        }, 1000);
      } else {
        toast({
          title: "Failed to preview attachment",
          description: "No attachment data found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error opening attachment:", error);
      toast({
        title: "Failed to preview attachment",
        description:
          error?.response?.data?.message || "Unable to open the attachment.",
        variant: "destructive",
      });
    } finally {
      setDownloadingAttachmentId(null);
    }
  };

  // Define base height
  const baseEmployeeInfoHeight = "h-8"; // Adjust this value to match the desired height

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
                    ? `This week | ${format(
                        parseISO(selectedWeekStartDate),
                        "MMM-d-y"
                      )} - ${format(parseISO(selectedWeekEndDate), "MMM-d-y")}`
                    : `${format(
                        parseISO(selectedWeekStartDate),
                        "MMM-d-y"
                      )} - ${format(parseISO(selectedWeekEndDate), "MMM-d-y")}`}
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
        {/* Employee Information */}

        <div className="bg-white shadow-sm rounded-md p-6 border border-gray-200 max-w-4xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
            {/* Left Column */}
            <InfoRow
              icon={<User size={16} className="text-gray-500" />}
              label="Employee ID"
              value={employeeInfo?.employeeId}
              isLoading={employeeInfoLoading}
              skeletonWidth="w-24"
            />

            {/* Right Column */}
            <InfoRow
              icon={<IdCard size={16} className="text-gray-500" />}
              label="Name"
              value={
                employeeInfo
                  ? `${employeeInfo.firstName} ${employeeInfo.lastName}`
                  : undefined
              }
              isLoading={employeeInfoLoading}
              skeletonWidth="w-32"
            />

            {/* Left Column */}
            <InfoRow
              icon={<Building2 size={16} className="text-gray-500" />}
              label="Client"
              value={employeeInfo?.clientName}
              isLoading={employeeInfoLoading}
              skeletonWidth="w-36"
            />

            {/* Right Column */}
            <InfoRow
              icon={<Mail size={16} className="text-gray-500" />}
              label="Email"
              value={employeeInfo?.email}
              isLoading={employeeInfoLoading}
              skeletonWidth="w-48"
            />

            {/* Left Column */}
            <InfoRow
              icon={<CalendarCheck size={16} className="text-gray-500" />}
              label="Start Date"
              value={(() => {
                try {
                  const parsed = parseISO(employeeInfo?.startDate || "");
                  return isValid(parsed) ? format(parsed, "MMM d Y") : "N/A";
                } catch {
                  return "N/A";
                }
              })()}
              isLoading={employeeInfoLoading}
              skeletonWidth="w-24"
            />

            {/* Right Column */}
            <InfoRow
              icon={<TreePalm size={16} className="text-gray-500" />}
              label="Available Leave"
              value={"0hrs"}
              isLoading={employeeInfoLoading}
              skeletonWidth="w-20"
            />
          </div>
        </div>
      </div>

      {/* Timesheet Table */}

      <TimesheetTable
        data={data}
        loading={!data}
        dayLabels={dayLabels}
        handleInputChange={handleInputChange}
        handleDeleteRow={handleDeleteRow}
        totalRow={totalRow}
      />

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
        {data && (isSaveButtonEnabled || loading) && (
          <Button
            onClick={handleSave}
            disabled={!isSaveButtonEnabled || loading}
            style={{ background: "#1c5e93", color: "white" }}
          >
            <SaveAllIcon className="mr-2" />
            {loading ? "Saving..." : isExistingTimesheet ? "Update" : "Save"}
          </Button>
        )}
      </div>

      {/* File Upload Section */}

      <AttachmentsSection
        data={data}
        uploading={uploading}
        tempUploadingFileName={tempUploadingFileName}
        downloadAttachment={downloadAttachment}
        removeAttachment={removeAttachment}
        handleFileSelect={handleFileSelect}
        fileInputRef={fileInputRef}
        downloadingAttachmentId={downloadingAttachmentId}
        deletingAttachmentId={deletingAttachmentId}
      />
    </div>
  );
};

const TimesheetManagement = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TimesheetManagementContent />
    </Suspense>
  );
};

export default TimesheetManagement;
