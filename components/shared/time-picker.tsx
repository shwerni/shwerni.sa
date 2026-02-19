"use client";
// React & Next
import React from "react";

// components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// utils
import { filterTimesAfter, timeOptions } from "@/utils";

// icons
import { Clock8Icon } from "lucide-react";

interface Props {
  value?: string;
  onChange?: (value?: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minTime?: string;
}

export function TimePicker({
  placeholder = "اختر موعد",
  disabled,
  value,
  minTime,
  onChange,
}: Props) {
  // options
  const options = React.useMemo(() => {
    if (!minTime) return timeOptions;
    return filterTimesAfter(timeOptions, minTime);
  }, [minTime]);

  // reset invalid value
  React.useEffect(() => {
    if (value && !options.some((o) => o.value === value)) {
      onChange?.(undefined);
    }
  }, [value, options, onChange]);

  return (
    <Select
      value={value}
      onValueChange={onChange}
      disabled={disabled}
      dir="rtl"
    >
      <SelectTrigger className="flex items-center gap-2">
        <Clock8Icon className="h-4 w-4 text-theme" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>

      <SelectContent side="bottom">
        <SelectGroup>
          {options.map((time) => (
            <SelectItem key={time.value} value={time.value}>
              {time.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
