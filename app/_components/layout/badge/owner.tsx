import React from "react";

// components
import { findCategory } from "@/utils";
import { Badge } from "@/components/ui/badge";

// utils
import { cn } from "@/lib/utils";
import { Categories } from "@/lib/generated/prisma/enums";

// props
interface Props {
  category: Categories;
  label?: string;
  type?: "consultant" | "category";
  children?: React.JSX.Element | string;
  className?: string;
}

export function CategoryBadge({
  children,
  category,
  className,
  label,
  type = "category",
}: Props) {
  return (
    <Badge
      variant="secondary"
      className={cn([className, findCategory(category)?.style])}
    >
      {label}
      {type === "consultant"
        ? findCategory(category)?.label
        : findCategory(category)?.category}
      {children}
    </Badge>
  );
}
