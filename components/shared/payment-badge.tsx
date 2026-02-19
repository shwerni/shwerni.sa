"use client";
// React & Next
import React from "react";

// componetns
import { Badge } from "@/components/ui/badge";

// utils
import { cn } from "@/lib/utils";
import { isEnglish, findPayment } from "@/utils";

// prisma
import { PaymentState } from "@/lib/generated/prisma/enums";
import { Lang } from "@/types/types";

// props
export interface Props {
  state: PaymentState;
  className?: string;
  lang?: Lang;
}

export const PaymentBadge = React.forwardRef<HTMLDivElement, Props>(
  ({ className, state, lang, ...props }, ref) => {
    // state
    const data = findPayment(state);

    return (
      <Badge
        {...props}
        ref={ref}
        className={cn("px-5 py-1", className, data?.style)}
      >
        {isEnglish(lang) ? state.toLowerCase() : data?.label}
      </Badge>
    );
  }
);

PaymentBadge.displayName = "PaymentBadge";
