// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// props
interface Props {
  dir: "ltr" | "rtl";
}

export default function StatisticsLoading({ dir }: Props) {
  // return
  return (
    <div className="min-h-72 space-y-10" dir={dir}>
      <Skeleton className="w-60 h-10 bg-zgrey-50" />
      <div className="flex flex-col gap-10">
        {Array(5)
          .fill(null)
          .map((i, index) => (
            <div key={index} className="flex items-center gap-5">
              <Skeleton className="w-20 h-20 bg-zgrey-50" />
              <Skeleton className="w-20 h-20 bg-zgrey-50" />
              <Separator className="w-11/12 max-w-56 mx-auto" />
            </div>
          ))}
      </div>
      <Skeleton className="w-60 h-10 bg-zgrey-50" />
    </div>
  );
}
