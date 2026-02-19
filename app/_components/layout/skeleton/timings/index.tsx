// React
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";

export function SkeltonTimings() {
  return (
    <div>
      <div className="grid justify-center justify-items-center grid-cols-1 xstmd:grid-cols-2 mdtsm:grid-cols-3 sm:grid-cols-4 zhead:grid-cols-5 gap-5 my-5">
        <Skeleton className="w-28 py-2 px-3" />
      </div>
      <Skeleton className="w-40 h-5 my-5" />
      <div className="cflex gap-10 my-10">
        <div className="rflex gap-10">
          <Skeleton className="w-28 h-10" />
          <Skeleton className="w-28 h-10" />
        </div>
        <div className="rflex gap-10">
          <Skeleton className="w-28 h-10" />
          <Skeleton className="w-28 h-10" />
        </div>
        <div className="rflex gap-10">
          <Skeleton className="w-28 h-10" />
          <Skeleton className="w-28 h-10" />
        </div>
        <Skeleton className="w-20 h-7" />
      </div>
    </div>
  );
}
