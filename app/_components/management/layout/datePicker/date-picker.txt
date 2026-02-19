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
import { isLangEn } from "@/app/_utils";

// icons
import { CalendarIcon } from "lucide-react";

// Props
interface Props {
  date: string;
  lang?: "en" | "ar";
  setDate: React.Dispatch<React.SetStateAction<string>>;
  disabled?: boolean;
}

// date picker
export const DatePicker = ({ setDate, lang, date, disabled }: Props) => {
  // langauge check
  const isEn = isLangEn(lang);

  // date
  const [newDate, setNewDate] = React.useState<Date | undefined>(
    date ? new Date(date) : new Date()
  );

  // open state
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant={"outline"}
          className={cn(
            "w-11/12 max-w-44 justify-start gap-2 font-normal text-xs sm:text-sm px-1 sm:px-4 bg-white dark:bg-background",
            !newDate && "text-muted-foreground",
            disabled && "opacity-75"
          )}
        >
          <CalendarIcon className="w-3.5 sm:w-4" />
          {newDate ? (
            format(newDate, "PPP", isEn ? {} : { locale: ar })
          ) : (
            <span>{isEn ? "Pick a date" : "اختر تاريخ"}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          locale={isEn ? enUS : ar}
          mode="single"
          selected={newDate}
          onSelect={(d) => {
            setNewDate(d);
            setDate(d ? format(d, "yyyy-MM-dd", {}) : date);
            setOpen(false);
          }}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
