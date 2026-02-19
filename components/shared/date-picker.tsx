"use client";
// React & Next
import React from "react";

// packages
import { ar } from "date-fns/locale";
import { format, isValid, parseISO } from "date-fns";

// component
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";

// utils
import { cn } from "@/lib/utils";

// icons
import SvgIcon from "./svg-icon";

// Props
interface Props {
  value?: string;
  onChange?: (value?: string) => void;
  disabled?: boolean;
  className?: string;
  minDate?: string;
}

// date picker
export const DatePicker = ({
  value,
  onChange,
  disabled,
  minDate,
  className,
}: Props) => {
  // open state
  const [open, setOpen] = React.useState<boolean>(false);

  const selectedDate = React.useMemo(() => {
    if (!value) return undefined;
    const parsed = parseISO(value);
    return isValid(parsed) ? parsed : undefined;
  }, [value]);

  const minDateParsed = React.useMemo(() => {
    if (!minDate) return undefined;
    const parsed = parseISO(minDate);
    return isValid(parsed) ? parsed : undefined;
  }, [minDate]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          className={cn(
            "w-11/12 max-w-44 justify-start gap-2 font-normal text-xs sm:text-sm px-1 sm:px-4 bg-white dark:bg-background",
            !selectedDate && "text-muted-foreground",
            disabled && "opacity-75",
            className,
          )}
        >
          <SvgIcon src="/svg/calendar.svg" size={10} className="w-3.5 sm:w-4" />

          {selectedDate ? (
            format(selectedDate, "PPP", { locale: ar })
          ) : (
            <span>اختر تاريخ</span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          locale={ar}
          mode="single"
          selected={selectedDate}
          onSelect={(date) => {
            onChange?.(date ? format(date, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
          disabled={minDateParsed ? { before: minDateParsed } : undefined}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
