// React & Next
import React from "react";

// packages
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { enUS } from "date-fns/locale";

// component
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

// utils
import { cn } from "@/lib/utils";
import { isEnglish } from "@/utils";

// icons
import { CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";

// Props
interface Props {
  range: DateRange;
  setRange: React.Dispatch<React.SetStateAction<DateRange>>;
  lang?: "en" | "ar";
}

// date picker
export const DatePickerRange = ({ range, setRange, lang = "en" }: Props) => {
  // langauge check
  const isEn = isEnglish(lang);

  // label
  const label =
    range?.from && range?.to
      ? `${format(range.from, "PPP", { locale: isEn ? enUS : ar })} → ${format(range.to, "PPP", { locale: isEn ? enUS : ar })}`
      : isEn
        ? "Pick a date range"
        : "اختر فترة زمنية";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-fit justify-start gap-2 font-normal text-xs sm:text-sm px-1 sm:px-4",
          )}
        >
          <CalendarIcon className="w-3.5 sm:w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          locale={isEn ? enUS : ar}
          mode="range"
          numberOfMonths={2}
          selected={range}
          onSelect={(r) => {
            if (r) setRange(r);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
