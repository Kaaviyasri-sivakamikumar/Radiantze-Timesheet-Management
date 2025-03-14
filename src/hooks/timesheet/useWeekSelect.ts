import { useState } from "react";

const useWeekSelect = () => {
  const [weekStartDate, setWeekStartDate] = useState<string | null>(null);

  const updateWeekStartDate = (date: string) => {
    setWeekStartDate(date);
  };

  return { weekStartDate, updateWeekStartDate };
};

export default useWeekSelect;
