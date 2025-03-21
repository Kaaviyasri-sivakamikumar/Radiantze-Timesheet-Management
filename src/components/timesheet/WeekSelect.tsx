import React, { useState } from "react";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subMonths,
  addMonths,
  format,
  isSameMonth,
} from "date-fns";

interface WeekSelectProps {
  onChange: (weekStartDate: string, weekEndDate: string) => void;
  onClose: () => void; // Callback to close dropdown
}

const getWeeksInMonth = (year: number, month: number) => {
  const firstDay = startOfMonth(new Date(year, month - 1));
  const lastDay = endOfMonth(new Date(year, month - 1));

  let weeks = [];
  let currentWeekStart = startOfWeek(firstDay, { weekStartsOn: 1 });

  while (currentWeekStart <= lastDay) {
    const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });

    if (isSameMonth(currentWeekStart, firstDay)) {
      weeks.push({
        start: format(currentWeekStart, "yyyy-MM-dd"),
        end: format(currentWeekEnd, "yyyy-MM-dd"),
      });
    }

    currentWeekStart = addWeeks(currentWeekStart, 1);
  }

  return weeks;
};

const WeekSelect: React.FC<WeekSelectProps> = ({ onChange, onClose }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  const weeks = getWeeksInMonth(year, month);

  return (
    <div className="p-4 bg-white shadow-md rounded-lg max-w-md mx-auto">
      {/* Month Navigation */}
      <div className="flex justify-between items-center mb-3 bg-[#1c5e93] text-white p-2 rounded">
        <button
          className="text-xl px-2 hover:bg-[#2470ab] rounded text-white"
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
        >
          &lt;
        </button>
        <h2 className="text-lg font-semibold">
          {format(currentDate, "yyyy-MMM")}
        </h2>
        <button
          className="text-xl px-2 hover:bg-[#2470ab] rounded text-white"
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
        >
          &gt;
        </button>
      </div>

      {/* Weeks List */}
      <ul className="border rounded-md divide-y">
        {weeks.map((week, index) => {
          const startDate = format(new Date(week.start), "yyyy-MMM-dd");
          const endDate = format(new Date(week.end), "yyyy-MMM-dd");
          return (
            <li
              key={index}
              className="p-3 cursor-pointer hover:bg-gray-100"
              onClick={() => {
                onChange(week.start, week.end);
                onClose();
              }}
            >
              {startDate} → {endDate}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default WeekSelect;
