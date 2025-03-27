import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase/admin";
import { validateWeekStartDate } from "@/lib/timesheet/utils";

// Initialize Firestore
const db = getFirestore();

const MAX_ACTIVITY_LOG_SIZE = 10; // Store the 10 most recent entries in entry timesheet activity log

interface Task {
  taskCode: string;
  taskName: string;
  hours: number;
}

interface DailyTimesheet {
  hoursWorked: number;
  tasks: Task[];
}

interface Timesheet {
  [date: string]: DailyTimesheet; // Dynamic keys (dates)
  totalHours: number;
  format: string;
}

export async function GET(request: Request) {
  try {
    // const body = await request.json();
    const tokenUser = await authenticateUser(request);
    const employeeId = tokenUser.customClaims?.employeeId;

    if (!employeeId) {
      throw new Error("Unauthorized access. Employee ID not found in token.");
    }

    // validateRequest(body, employeeId);

    // const { year, month, weekStartDate } = body;

    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month");
    const weekStartDate = searchParams.get("weekStartDate");

    if (!year || !month || !weekStartDate) {
      throw new Error(
        "Missing required query parameters: year, month, weekStartDate."
      );
    }

    validateWeekStartDate(weekStartDate);
    validateYearAndMonth(year, month);

    const timesheetRef = db
      .collection("timesheets")
      .doc(employeeId)
      .collection(year)
      .doc(month);

    const timesheetDoc = await timesheetRef.get();

    if (!timesheetDoc.exists) {
      return NextResponse.json(
        { success: false, message: "No timesheet data found." },
        { status: 404 }
      );
    }

    const timesheetData = timesheetDoc.data();
    const weekData = timesheetData ? timesheetData[weekStartDate] : null;

    if (!weekData) {
      return NextResponse.json(
        { success: false, message: "No timesheet found for the given week." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      employeeId,
      weekStartDate,
      year,
      month,
      timesheet: weekData.timesheet,
      totalHours: weekData.totalHours,
      format: weekData.format,
      activityLog: weekData.activityLog || [],
    });
  } catch (error: any) {
    console.error("Error fetching timesheet from Firestore:", error);
    return handleErrorResponse(error);
  }
}
function handleErrorResponse(error: any) {
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 401 }
    );
  }

  if (error instanceof Error) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 400 }
    );
  }
  return NextResponse.json(
    {
      success: false,
      message: "Internal server error. Contact Administrator.",
      error: error?.message || "Unknown error",
    },
    { status: 500 }
  );
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const tokenUser = await authenticateUser(request);
    const employeeId = tokenUser.customClaims?.employeeId;
    const isAdmin = tokenUser.customClaims?.isAdmin;
    const updatedBy =
      tokenUser.displayName || tokenUser.email || "Unknown User";

    validateRequest(body, employeeId);

    const { year, month, weekStartDate, timesheet } = body;

    if (!isTimesheet(timesheet)) {
      return NextResponse.json(
        { message: "Invalid timesheet format." },
        { status: 400 }
      );
    }

    const totalHours = timesheet.totalHours;

    validateWeekStartDate(weekStartDate);
    validateYearAndMonth(year, month);
    const weeklyHours = validateTimesheetStructure(timesheet);

    validateTotalHours(timesheet, totalHours);
    console.log("REACHED");
    validateDateConsistency(weekStartDate, year, month);

    validateTimesheetDates(weekStartDate, timesheet);
    validateWeeklyHoursLimit(weeklyHours);

    const changes = await saveTimesheet(
      employeeId,
      year,
      month,
      weekStartDate,
      timesheet,
      updatedBy,
      isAdmin
    );

    return NextResponse.json({
      success: true,
      employeeId,
      weekStartDate,
      year,
      month,
      message: "Timesheet saved successfully.",
      changes: changes,
    });
  } catch (error: any) {
    console.error("Error saving timesheet to Firestore:", error);

    return handleErrorResponse(error);
  }
}
function isTimesheet(obj: any): obj is Timesheet {
  if (
    typeof obj === "object" &&
    typeof obj.totalHours === "number" &&
    typeof obj.format === "string"
  ) {
    for (const key in obj) {
      if (key !== "totalHours" && key !== "format") {
        const dailyTimesheet = obj[key];
        if (
          typeof dailyTimesheet === "object" &&
          typeof dailyTimesheet.hoursWorked === "number" &&
          Array.isArray(dailyTimesheet.tasks)
        ) {
          for (const task of dailyTimesheet.tasks) {
            if (
              typeof task !== "object" ||
              typeof task.taskCode !== "string" ||
              typeof task.taskName !== "string" ||
              typeof task.hours !== "number"
            ) {
              return false;
            }
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }
  return false;
}

export class ForbiddenError extends Error {
  status: number;

  constructor(message = "Forbidden") {
    super(message);
    this.status = 403;
  }
}

async function authenticateUser(request: Request) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    throw new ForbiddenError(
      "Forbidden: Missing or invalid authorization header"
    );
  }

  const token = authHeader.split("Bearer ")[1];
  let decodedToken;

  try {
    decodedToken = await adminAuth.verifyIdToken(token);
  } catch (error) {
    console.error("Error verifying token:", error);
    throw new ForbiddenError("Forbidden: Invalid or expired token.");
  }

  try {
    return await adminAuth.getUser(decodedToken.uid);
  } catch (error) {
    console.error("Error fetching admin user:", error);
    throw new Error("Error retrieving admin user details.");
  }
}

function validateYearAndMonth(year: string, month: string) {
  if (!/^\d{4}$/.test(year)) {
    throw new Error("Invalid year format. Must be YYYY.");
  }
  if (!/^\d{2}$/.test(month)) {
    throw new Error("Invalid month format. Must be MM.");
  }
}

function validateRequest(body: any, employeeId: string) {
  if (!body) throw new Error("Request body is missing.");
  if (!employeeId) throw new Error("employeeId is required.");
  if (!body.timesheet || typeof body.timesheet !== "object")
    throw new Error("timesheet is required and must be an object.");
  if (!body.weekStartDate) throw new Error("weekStartDate is required.");
  if (!body.year) throw new Error("year is required.");
  if (!body.month) throw new Error("month is required.");
  if (typeof body.timesheet.totalHours !== "number")
    throw new Error("timesheet.totalHours is required and must be a number.");
}

// function validateWeekStartDate(weekStartDate: string) {
//   if (!isValidMonday(weekStartDate)) {
//     throw new Error(
//       "Invalid weekStartDate. Must be a Monday in YYYY-MM-DD format."
//     );
//   }
// }

function validateTimesheetStructure(timesheet: any): number {
  let weeklyHours = 0;
  for (const dayKey in timesheet) {
    if (dayKey !== "totalHours" && dayKey !== "format") {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
        throw new Error(
          `Invalid date format ${dayKey} in timesheet. Must beAgentError-MM-DD.`
        );
      }

      const day = timesheet[dayKey];

      if (typeof day !== "object" || typeof day.hoursWorked !== "number") {
        throw new Error(`Invalid timesheet structure for day ${dayKey}.`);
      }

      if (day.hoursWorked > 24) {
        throw new Error(`Daily hours for ${dayKey} exceed 24 hours.`); // Corrected line
      }

      weeklyHours += day.hoursWorked;

      validateTaskStructure(day.tasks, dayKey);

      if (day.tasks && !Array.isArray(day.tasks)) {
        throw new Error(`Tasks for day ${dayKey} must be an array.`);
      }

      if (day.tasks) {
        let taskHoursSum = 0;
        for (const task of day.tasks) {
          if (typeof task.hours !== "number") {
            throw new Error(`Task hours for day ${dayKey} must be a number.`);
          }
          taskHoursSum += task.hours;
        }
        if (Math.abs(taskHoursSum - day.hoursWorked) > 0.0001) {
          throw new Error(
            `Sum of task hours for day ${dayKey} does not match hoursWorked.`
          );
        }
      }
    }
  }
  return weeklyHours;
}

function validateTotalHours(timesheet: any, totalHours: number) {
  const calculatedTotalHours = calculateTotalHours(timesheet);

  if (Math.abs(calculatedTotalHours - totalHours) > 0.0001) {
    console.log("REACHED3");
    throw new Error("Total hours do not match the calculated sum.");
  }
}
function validateDateConsistency(
  weekStartDate: string,
  year: string,
  month: string
) {
  const expectedYear = parseInt(weekStartDate.substring(0, 4), 10);
  const expectedMonth = parseInt(weekStartDate.substring(5, 7), 10)
    .toString()
    .padStart(2, "0");

  if (parseInt(year, 10) !== expectedYear) {
    throw new Error("Year in request does not match year in weekStartDate.");
  }
  if (month !== expectedMonth) {
    throw new Error("Month in request does not match month in weekStartDate.");
  }
}

function validateTaskStructure(tasks: any[] | undefined, dayKey: string) {
  if (tasks && tasks.length > 10) {
    throw new Error(
      `Invalid task structure for day ${dayKey}. Per day you are allowed to add only max of 10 tasks.`
    );
  }

  if (tasks && Array.isArray(tasks)) {
    for (const task of tasks) {
      if (
        typeof task !== "object" ||
        typeof task.hours !== "number" ||
        typeof task.taskCode !== "string" ||
        typeof task.taskName !== "string"
      ) {
        throw new Error(
          `Invalid task structure for day ${dayKey}. Each task must have hours, taskCode, and taskName.`
        );
      }
    }
  }
}

function validateTimesheetDates(weekStartDate: string, timesheet: any) {
  const weekStart = new Date(weekStartDate);
  for (const dateKey in timesheet) {
    console.log(dateKey);
    if (dateKey !== "totalHours" && dateKey !== "format") {
      const currentDate = new Date(dateKey);
      if (isNaN(currentDate.getTime())) {
        throw new Error(`Invalid date ${dateKey} in timesheet.`);
      }
      const diffDays = Math.round(
        (currentDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (diffDays < 0 || diffDays > 6) {
        throw new Error(
          `Dates in timesheet are outside the week starting ${weekStartDate}.`
        );
      }
    }
  }
}

function validateWeeklyHoursLimit(weeklyHours: number) {
  if (weeklyHours > 168) {
    throw new Error("Weekly hours exceed 168 hours.");
  }
}

// function isValidMonday(dateString: string): boolean {
//   if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
//   const [year, month, day] = dateString
//     .split("-")
//     .map((num) => parseInt(num, 10));
//   const date = new Date(year, month - 1, day);
//   return !isNaN(date.getTime()) && date.getDay() === 1; // 1 represents Monday
// }

async function saveTimesheet(
  employeeId: string,
  year: string,
  month: string,
  weekStartDate: string,
  timesheet: any,
  updatedBy: string,
  isAdmin: boolean
) {
  const timesheetRef = db
    .collection("timesheets")
    .doc(employeeId)
    .collection(year)
    .doc(month);

  const timesheetDoc = await timesheetRef.get();

  let existingWeekData = {};
  if (timesheetDoc.exists) {
    existingWeekData = timesheetDoc.data() || {};
  }

  let existingWeekStartDateData = existingWeekData[weekStartDate] || undefined;

  let activityLog = existingWeekStartDateData?.activityLog || [];

  let changes: any[] = [];
  let action: string;
  console.log("existingWeekStartDateData", existingWeekStartDateData);

  if (!existingWeekStartDateData) {
    action = "New timesheet submitted";
    console.log("New timesheet submitted");
    changes.push("New timesheet submitted");
  } else {
    action = "Timesheet updated";
    console.log("Timesheet updated");

    changes = deepCompare(existingWeekStartDateData?.timesheet, timesheet, "");

    // changes = [];
  }

  console.log("changes: ", changes);

  if (changes.length > 0) {
    const newActivity = {
      updatedAt: new Date().toISOString(),
      updatedBy: updatedBy,
      isUpdatedByAdmin: isAdmin,
      action: action,
      changes: changes,
    };

    activityLog.push(newActivity);
  }

  if (activityLog.length > MAX_ACTIVITY_LOG_SIZE) {
    activityLog.shift();
  }

  const weekData = {
    timesheet,
    totalHours: calculateTotalHours(timesheet),
    format: timesheet.format,
    activityLog: activityLog,
  };

  await timesheetRef.set({ [weekStartDate]: weekData }, { merge: true });

  return changes;
}

function deepCompare(obj1, obj2, path = "", visited = new WeakMap()) {
  try {
    let changes = [];

    // Ensure obj1 and obj2 are valid objects, otherwise return empty
    if (
      typeof obj1 !== "object" ||
      typeof obj2 !== "object" ||
      obj1 === null ||
      obj2 === null
    ) {
      return changes;
    }

    if (visited.has(obj1) || visited.has(obj2)) {
      return changes;
    }
    visited.set(obj1, true);
    visited.set(obj2, true);

    const keys = new Set([
      ...Object.keys(obj1 || {}),
      ...Object.keys(obj2 || {}),
    ]);

    keys.forEach((key) => {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1 ? obj1[key] : undefined;
      const val2 = obj2 ? obj2[key] : undefined;

      if (
        typeof val1 === "object" &&
        typeof val2 === "object" &&
        val1 &&
        val2
      ) {
        // Special handling for timesheet data at the date level
        if ("tasks" in val1 || "tasks" in val2) {
          const tasks1 = val1.tasks || [];
          const tasks2 = val2.tasks || [];

          // Compute total hours dynamically
          const totalHours1 = Array.isArray(tasks1)
            ? tasks1.reduce((sum, t) => sum + (t.hours || 0), 0)
            : 0;
          const totalHours2 = Array.isArray(tasks2)
            ? tasks2.reduce((sum, t) => sum + (t.hours || 0), 0)
            : 0;

          if (totalHours1 !== totalHours2) {
            changes.push(
              `Total hours changed from ${totalHours1} to ${totalHours2} for ${key}`
            );
          }

          // Track task changes
          const taskMap1 = new Map(tasks1.map((t) => [t.taskCode, t]));
          const taskMap2 = new Map(tasks2.map((t) => [t.taskCode, t]));

          tasks2.forEach((task) => {
            if (!taskMap1.has(task.taskCode)) {
              changes.push(
                `New task added (${task.taskName}) with ${task.hours} hours for ${key}`
              );
            } else {
              const oldTask = taskMap1.get(task.taskCode);
              if (oldTask.hours !== task.hours) {
                changes.push(
                  `Task (${task.taskName}) hours changed from ${oldTask.hours} to ${task.hours} ${key}`
                );
              }
            }
          });

          // Detect removed tasks
          tasks1.forEach((task) => {
            if (!taskMap2.has(task.taskCode)) {
              changes.push(`Task (${task.taskName}) was removed for ${key}`);
            }
          });

          // **Do NOT run deepCompare again on "tasks" to prevent duplication**
          return;
        }

        // Continue deep comparison for other nested objects
        changes = changes.concat(deepCompare(val1, val2, fullPath, visited));
      } else if (JSON.stringify(val1) !== JSON.stringify(val2)) {
        changes.push(
          `${fullPath}: changed from ${JSON.stringify(
            val1
          )} to ${JSON.stringify(val2)}`
        );
      }
    });

    return changes;
  } catch (error) {
    console.error("Error in deepCompare:", error);
    return ["Unable to detect changes."]; // Ensures server execution continues smoothly
  }
}

function calculateTotalHours(
  timesheet: Record<
    string,
    { hoursWorked: number; tasks?: { hours: number }[] }
  >
): number {
  let totalHours = 0;

  Object.entries(timesheet).forEach(([key, day]) => {
    if (key !== "totalHours" && key !== "format") {
      if (typeof day.hoursWorked === "number") {
        totalHours += day.hoursWorked;
      }
    }
  });
  return totalHours;
}
