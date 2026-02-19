// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import { Section } from "@/app/_components/layout/section";
import { Separator } from "@/components/ui/separator";
import Spinner from "@/app/_components/layout/skeleton/spinners";

export function ConsultantSkeleton() {
  return (
    <Section>
      <div className="flex flex-col items-start gap-10">
        <div className="flex flex-col gap-2">
          <Skeleton className="w-40 h-5 bg-zgrey-50" />
          <Skeleton className="w-20 h-3 bg-zgrey-50" />
        </div>
        <Separator className="w-11/12 bg-zgrey-50" />
        <div className="flex flex-col gap-2">
          <Skeleton className="w-20 h-3 bg-zgrey-50" />
          <Skeleton className="w-80 h-7 bg-zgrey-50" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-20 h-3 bg-zgrey-50" />
          <Skeleton className="w-80 h-7 bg-zgrey-50" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-20 h-3 bg-zgrey-50" />
          <Skeleton className="w-80 h-7 bg-zgrey-50" />
        </div>
        <div className="flex flex-col gap-2">
          <Skeleton className="w-20 h-3 bg-zgrey-50" />
          <Skeleton className="w-80 h-7 bg-zgrey-50" />
        </div>
        <div className="flex flex-row gap-4">
          <div className="flex flex-col gap-2">
            <Skeleton className="w-20 h-3 bg-zgrey-50" />
            <Skeleton className="w-36 h-20 bg-zgrey-50" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="w-20 h-3 bg-zgrey-50" />
            <Skeleton className="w-36 h-20 bg-zgrey-50" />
          </div>
        </div>
        <div className="rflex gap-10">
          <Skeleton className="w-14 h-7 bg-zgrey-50" />
          <Spinner
            style="stroke-zblue-200 w-10 h-10"
            title="جاري التحميل"
            tstyle="text-zgrey-100"
          />
        </div>
      </div>
    </Section>
  );
}
