"use client";

import React from "react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { isEnglish } from "@/utils";
import { CalendarIcon } from "lucide-react";

interface Props {
  date: string;
  lang?: "en" | "ar";
  setDate: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
}

export const DatePicker = ({ setDate, lang, date, disabled }: Props) => {
  const isEn = isEnglish(lang);

  // Internal state
  const [open, setOpen] = React.useState(false);
  const [newDate, setNewDate] = React.useState<Date | undefined>(
    date ? new Date(date) : undefined,
  );
  const [month, setMonth] = React.useState<Date | undefined>(newDate);
  const [value, setValue] = React.useState(date || "");

  // Validate date
  const isValidDate = (d: Date | undefined) => d && !isNaN(d.getTime());

  // Handle manual input
  const handleInputChange = (val: string) => {
    setValue(val);

    // parse numeric format yyyy-MM-dd
    const parts = val.split("-");
    if (parts.length === 3) {
      const [y, m, d] = parts.map(Number);
      const parsed = new Date(y, m - 1, d);
      if (isValidDate(parsed)) {
        setNewDate(parsed);
        setMonth(parsed);
        setDate(format(parsed, "yyyy-MM-dd"));
      }
    }
  };

  return (
    <div className="relative w-11/12 max-w-44">
      <Input
        value={value}
        placeholder="yyyy-MM-dd"
        disabled={disabled}
        onChange={(e) => handleInputChange(e.target.value)}
        className="pr-10"
      />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild disabled={disabled}>
          <Button
            variant="ghost"
            className={cn(
              "absolute top-1/2 right-2 -translate-y-1/2 p-1",
              disabled && "opacity-50",
            )}
          >
            <CalendarIcon className="w-4 h-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            locale={isEn ? enUS : ar} // only calendar month labels
            mode="single"
            selected={newDate}
            month={month}
            onMonthChange={setMonth}
            onSelect={(d) => {
              if (!d) return;
              setNewDate(d);
              const formatted = format(d, "yyyy-MM-dd"); // always numbers
              setValue(formatted);
              setDate(formatted);
              setOpen(false);
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
};
