import { startOfWeek, endOfWeek, format, eachDayOfInterval, parseISO } from "date-fns";

export function isValidMonday(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, month, day] = dateString
    .split("-")
    .map((num) => parseInt(num, 10));
  const date = new Date(year, month - 1, day);
  return !isNaN(date.getTime()) && date.getDay() === 1; // 1 represents Monday
}


export function validateWeekStartDate(weekStartDate: string) {
  if (!isValidMonday(weekStartDate)) {
    throw new Error(
      "Invalid weekStartDate. Must be a Monday in YYYY-MM-DD format."
    );
  }
}

export function validateYearAndMonth(year: string, month: string) {
  if (!/^\d{4}$/.test(year)) {
    throw new Error("Invalid year format. Must be YYYY.");
  }
  if (!/^\d{2}$/.test(month)) {
    throw new Error("Invalid month format. Must be MM.");
  }
}

export function convertDateToSpecificFormat (date:Date) {
  if (!(date instanceof Date)) return null;
  return date.toISOString().split('T')[0]; // Returns yyyy-mm-dd format
};



/**
 * Gets the start and end date of the current week for a given date.
 * The week starts on Monday and ends on Sunday.
 * @param date - The reference date (default is today)
 * @returns An object with start and end dates in "YYYY-MM-DD" format.
 */
export function getCurrentWeekRange(date: Date = new Date()): { start: string; end: string } {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 }); // Monday as start
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 }); // Sunday as end

  return {
    start: format(weekStart, "yyyy-MM-dd"),
    end: format(weekEnd, "yyyy-MM-dd"),
  };
}



export function getYearMonth(weekStartDate: string) {
  const [year, month] = weekStartDate.split("-");

  return {
    year,
    month,
  };
}


export function getDatesBetweenRange(startDate: string, endDate: string) {
  return eachDayOfInterval({
    start: parseISO(startDate),
    end: parseISO(endDate),
  });
}