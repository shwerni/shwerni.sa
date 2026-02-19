// React & Next
import React from "react";

// componetns
import { Badge } from "@/components/ui/badge";

// utils
import { cn } from "@/lib/utils";
import { findCategory } from "@/utils";
import { cva, type VariantProps } from "class-variance-authority";

// prisma
import { Categories } from "@/lib/generated/prisma/enums";

// variants
const Variants = cva("rounded-lg", {
  variants: {
    size: {
      lg: "text-base px-4 py-2.5",
      default: "text-sm px-3 py-2",
      sm: "text-xs px-2.5 py-1.5",
      xs: "text-xs px-2 py-1.5",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

// props
export interface Props
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof Variants> {
  category: Categories;
  className?: string;
  label?: "consultant" | "category";
}

export const CategoryBadge = React.forwardRef<HTMLDivElement, Props>(
  ({ className, category, size, label = "consultant", ...props }, ref) => {
    // state
    const data = findCategory(category);

    return (
      <Badge
        ref={ref}
        {...props}
        className={cn(Variants({ size }), className, data?.style)}
      >
        {label === "consultant" ? data?.label : data?.category}
      </Badge>
    );
  }
);

CategoryBadge.displayName = "CategoryBadge";
