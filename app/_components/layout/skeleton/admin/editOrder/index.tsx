// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import Spinner from "@/app/_components/layout/skeleton/spinners";

export default function SkeletonEditOrder() {
  return (
    <div className="cflex gap-10 max-w-[300px] min-h-80 w-11/12 mx-auto">
      <Skeleton className="w-40 h-5" />
      <div className="grid grid-cols-2 gap-5">
        <Skeleton className="w-20 h-4" />
        <Skeleton className="w-20 h-4" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Skeleton className="w-20 h-7" />
        <Skeleton className="w-20 h-7" />
      </div>
      <div className="grid grid-cols-2 gap-5">
        <Skeleton className="w-20 h-7" />
        <Skeleton className="w-20 h-7" />
      </div>
      <div className="w-fit mx-auto">
        <Spinner
          style="stroke-zgrey-50 w-7 h-7"
          title="loading"
          tstyle="text-zblack-200"
        />
      </div>
    </div>
  );
}
