"use client";
// React & Next
import React from "react";

// components
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// lib
import { cn } from "@/lib/utils";

// option
export interface ChoiceOption {
  value: string;
  label: string;
}

// props
interface Props {
  value: string | undefined;
  onChange: (value: string) => void;
  options: readonly ChoiceOption[];
  disabled?: boolean;
  className?: string;
}

// radio group rendered as tappable options (whole row is clickable)
export const ChoiceGroup = React.forwardRef<HTMLDivElement, Props>(
  ({ value, onChange, options, disabled, className, ...rest }, ref) => {
    const baseId = React.useId();

    return (
      <RadioGroup
        ref={ref}
        dir="rtl"
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        className={cn("grid gap-2", className)}
        // forwards id / aria-invalid / aria-describedby from FormControl
        {...rest}
      >
        {options.map((option) => {
          const id = `${baseId}-${option.value}`;
          return (
            <Label
              key={option.value}
              htmlFor={id}
              className={cn(
                "flex items-center gap-2 rounded-lg border border-zgrey-50 px-3 py-2.5 text-sm font-normal cursor-pointer transition-colors",
                "has-data-[state=checked]:border-zblue-200 has-data-[state=checked]:bg-zblue-200/5",
                disabled && "cursor-not-allowed opacity-60",
              )}
            >
              <RadioGroupItem id={id} value={option.value} />
              {option.label}
            </Label>
          );
        })}
      </RadioGroup>
    );
  },
);
ChoiceGroup.displayName = "ChoiceGroup";
