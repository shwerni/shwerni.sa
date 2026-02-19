// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonOrderTable() {
  return (
    <div className="space-y-10 my-10">
      <Skeleton className="w-40 h-5 bg-zgrey-50" />
      <div className="flex flex-row justify-between">
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
      </div>
      <div className="flex flex-row justify-between">
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
      </div>
      <div className="flex flex-row justify-between">
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
      </div>
    </div>
  );
}
