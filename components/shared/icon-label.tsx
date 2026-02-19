// React & Next
import React from "react";

// utils
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const Variants = cva("flex items-center", {
  variants: {
    orientation: {
      horizontal: "flex-row",
      vertical: "flex-col",
    },
    size: {
      lg: "text-lg gap-2",
      default: "text-base gap-1.5",
      sm: "text-xs gap-1.5",
    },
  },
  defaultVariants: {
    orientation: "horizontal",
    size: "default",
  },
});

export interface Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof Variants> {
  Icon?: React.ComponentType<{ className: string }>;
  label?: string;
}

export const IconLabel = React.forwardRef<HTMLDivElement, Props>(
  ({ className, Icon, label, orientation, size, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(Variants({ orientation, size }), className)}
        {...props}
      >
        {label}
        {Icon && (
          <Icon
            className={cn([
              size === "lg" && "w-5! h-5!",
              size === "sm" && "w-2.5! h-2.5!",
            ])}
          />
        )}
      </div>
    );
  }
);

IconLabel.displayName = "IconLabel";
