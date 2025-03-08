import { NextResponse } from "next/server";
import { getFirestore } from "firebase-admin/firestore";
import { adminAuth } from "@/lib/firebase/admin";

// Initialize Firestore
const db = getFirestore();

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Missing or invalid authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (error) {
      console.error("Error verifying token:", error);
      return NextResponse.json(
        { message: "Invalid or expired token." },
        { status: 403 }
      );
    }

    let tokenUser;
    try {
      tokenUser = await adminAuth.getUser(decodedToken.uid);
    } catch (error) {
      console.error("Error fetching admin user:", error);
      return NextResponse.json(
        { message: "Error retrieving admin user details." },
        { status: 500 }
      );
    }

    const updatedBy =
      tokenUser.displayName || tokenUser.email || "Unknown User";
    const employeeId = tokenUser.customClaims?.employeeId;

    const isAdmin = tokenUser.customClaims?.isAdmin;
    console.log("Adding timesheet information for employee: ", isAdmin);

    // 1. Missing or Invalid Fields
    if (!body) {
      return NextResponse.json(
        { message: "Request body is missing." },
        { status: 400 }
      );
    }
    if (!employeeId) {
      return NextResponse.json(
        { message: "employeeId is required." },
        { status: 400 }
      );
    }
    if (!body.timesheet || typeof body.timesheet !== "object") {
      return NextResponse.json(
        { message: "timesheet is required and must be an object." },
        { status: 400 }
      );
    }
    if (!body.weekStartDate) {
      return NextResponse.json(
        { message: "weekStartDate is required." },
        { status: 400 }
      );
    }
    if (!body.year) {
      return NextResponse.json(
        { message: "year is required." },
        { status: 400 }
      );
    }
    if (!body.month) {
      return NextResponse.json(
        { message: "month is required." },
        { status: 400 }
      );
    }
    if (typeof body.timesheet.totalHours !== "number") {
      return NextResponse.json(
        { message: "timesheet.totalHours is required and must be a number." },
        { status: 400 }
      );
    }

    const { year, month, weekStartDate, timesheet } = body;
    const totalHours = timesheet.totalHours;

    // 2. Invalid weekStartDate Format or Not a Monday
    if (!isValidMonday(weekStartDate)) {
      return NextResponse.json(
        {
          message:
            "Invalid weekStartDate. Must be a Monday inAgentError-MM-DD format.",
        },
        { status: 400 }
      );
    }

    // 3. Year and Month Format Validation
    if (!/^\d{4}$/.test(year)) {
      return NextResponse.json(
        { message: "Invalid year format. Must beAgentError." },
        { status: 400 }
      );
    }
    if (!/^\d{2}$/.test(month)) {
      return NextResponse.json(
        { message: "Invalid month format. Must be MM." },
        { status: 400 }
      );
    }

    // 4. Timesheet Data Structure Validation
    let weeklyHours = 0;
    for (const dayKey in timesheet) {
      if (dayKey !== "totalHours" && dayKey !== "format") {
        // 4.1. Date Format Validation for Timesheet Keys
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dayKey)) {
          return NextResponse.json(
            {
              message: `Invalid date format ${dayKey} in timesheet. Must beAgentError-MM-DD.`,
            },
            { status: 400 }
          );
        }

        const day = timesheet[dayKey];
        if (typeof day !== "object" || typeof day.hoursWorked !== "number") {
          return NextResponse.json(
            { message: `Invalid timesheet structure for day ${dayKey}.` },
            { status: 400 }
          );
        }
        if (day.hoursWorked > 24) {
          return NextResponse.json(
            { message: `Daily hours for ${dayKey} exceed 24 hours.` },
            { status: 400 }
          );
        }
        weeklyHours += day.hoursWorked;

        if (day.tasks && !Array.isArray(day.tasks)) {
          return NextResponse.json(
            { message: `Tasks for day ${dayKey} must be an array.` },
            { status: 400 }
          );
        }
        if (day.tasks) {
          let taskHoursSum = 0;
          for (const task of day.tasks) {
            if (typeof task.hours !== "number") {
              return NextResponse.json(
                { message: `Task hours for day ${dayKey} must be a number.` },
                { status: 400 }
              );
            }
            taskHoursSum += task.hours;
          }
          if (Math.abs(taskHoursSum - day.hoursWorked) > 0.0001) {
            return NextResponse.json(
              {
                message: `Sum of task hours for day ${dayKey} does not match hoursWorked.`,
              },
              { status: 400 }
            );
          }
        }
      }
    }

    // 5. Total Hours Calculation and Validation
    const calculatedTotalHours = calculateTotalHours(timesheet);
    if (Math.abs(calculatedTotalHours - totalHours) > 0.0001) {
      return NextResponse.json(
        { message: "Total hours do not match the calculated sum." },
        { status: 400 }
      );
    }

    // 6. Year/Month Consistency Check
    const expectedYear = parseInt(weekStartDate.substring(0, 4), 10);
    const expectedMonth = parseInt(weekStartDate.substring(5, 7), 10)
      .toString()
      .padStart(2, "0");

    if (parseInt(year, 10) !== expectedYear) {
      return NextResponse.json(
        { message: "Year in request does not match year in weekStartDate." },
        { status: 400 }
      );
    }
    if (month !== expectedMonth) {
      return NextResponse.json(
        { message: "Month in request does not match month in weekStartDate." },
        { status: 400 }
      );
    }

    // 7. Consistency between dates in timesheet and weekStartDate
    const weekStart = new Date(weekStartDate);
    for (const dateKey in timesheet) {
      if (dateKey !== "totalHours" && dateKey !== "format") {
        const currentDate = new Date(dateKey);
        if (isNaN(currentDate.getTime())) {
          return NextResponse.json(
            { message: `Invalid date ${dateKey} in timesheet.` },
            { status: 400 }
          );
        }
        const diffDays = Math.round(
          (currentDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (diffDays < 0 || diffDays > 6) {
          return NextResponse.json(
            {
              message: `Dates in timesheet are outside the week starting ${weekStartDate}.`,
            },
            { status: 400 }
          );
        }
      }
    }

    // 8. Weekly Hours Limit Check
    if (weeklyHours > 168) {
      return NextResponse.json(
        { message: "Weekly hours exceed 168 hours." },
        { status: 400 }
      );
    }

    // Prepare the data to be saved to Firestore
    const newActivity = {
      updatedAt: new Date(),
      updatedBy: updatedBy,
      isUpdatedByAdmin: isAdmin,
    };

    // Firestore document path: timesheets/{employeeId}/{year}/{month}
    const timesheetRef = db
      .collection("timesheets")
      .doc(employeeId)
      .collection(year)
      .doc(month);

    // Fetch the existing document
    const timesheetDoc = await timesheetRef.get();

    let existingWeekData = {};
    if (timesheetDoc.exists) {
      existingWeekData = timesheetDoc.data() || {};
    }

    let existingWeekStartDateData = existingWeekData[weekStartDate] || {};

    let activityLog = existingWeekStartDateData.activityLog || [];

    // Add the new activity to the activityLog array
    activityLog.push(newActivity);

    const weekData = {
      timesheet,
      totalHours: calculatedTotalHours,
      format: timesheet.format,
      activityLog: activityLog,
    };

    // Firestore document path: timesheets/{employeeId}/{year}/{month}/{weekStartDate}

    // Save or merge the data for the given week (weekStartDate as a key)
    await timesheetRef.set({ [weekStartDate]: weekData }, { merge: true });

    return NextResponse.json({
      success: true,
      employeeId,
      weekStartDate,
      year,
      month,
      message: "Timesheet saved successfully.",
    });
  } catch (error: any) {
    console.error("Error saving timesheet to Firestore:", error);
    return NextResponse.json(
      {
        message: "Internal server error.",
        error: error?.message || "Unknown error",
      },
      { status: 500 }
    );
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

function isValidMonday(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString
    .split("-")
    .map((num) => parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime()) && date.getDay() === 1;
}
