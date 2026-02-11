"use client";

import { Button } from "@/components/ui/button";
import { formatMonthYear } from "@/lib/format-utils";

interface MonthYearPickerProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export function MonthYearPicker({ month, year, onChange }: MonthYearPickerProps) {
  const goToPrevious = () => {
    if (month === 0) {
      onChange(11, year - 1);
    } else {
      onChange(month - 1, year);
    }
  };

  const goToNext = () => {
    if (month === 11) {
      onChange(0, year + 1);
    } else {
      onChange(month + 1, year);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <Button variant="ghost" size="sm" onClick={goToPrevious}>&larr;</Button>
      <p className="text-sm font-medium">{formatMonthYear(month, year)}</p>
      <Button variant="ghost" size="sm" onClick={goToNext}>&rarr;</Button>
    </div>
  );
}
