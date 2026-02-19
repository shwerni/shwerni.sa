// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonPayStatus() {
  return (
    <div className="max-w-[400px] w-10/12 mx-auto my-10 space-y-5">
      <Skeleton className="w-20 h-5 bg-zgrey-50" />
      <Skeleton className="w-40 h-10 bg-zgrey-50 mx-auto" />
      <div className="cflex gap-y-10">
        <Skeleton className="w-80 h-40 bg-zgrey-50" />
        <Skeleton className="w-24 h-10 bg-zgrey-50" />
      </div>
    </div>
  );
}
