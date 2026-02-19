// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function SkeletonOwners() {
  return (
    <div className="mx-5">
      <div className="flex flex-col items-end justify-center gap-3 my-5">
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
        <Skeleton className="w-20 h-3 bg-zgrey-50" />
      </div>
      <Separator className="w-11/12 mx-auto" />
      <div className="flex justify-end">
        <Skeleton className="w-40 h-2 my-5 bg-zgrey-50" />
      </div>
      <div
        className="grid grid-cols-1 xs:grid-cols-2  sm:!grid-cols-3 zhead:!grid-cols-4 gap-5 my-5"
        dir="rtl"
      >
        <Skeleton className="w-40 h-40 bg-zgrey-50 hidden xs:block" />
        <Skeleton className="w-40 h-40 bg-zgrey-50 hidden xs:block" />
        <Skeleton className="w-40 h-40 bg-zgrey-50 hidden xs:block" />
        <Skeleton className="w-40 h-40 bg-zgrey-50 hidden xs:block" />
        <Skeleton className="w-40 h-40 bg-zgrey-50" />
        <Skeleton className="w-40 h-40 bg-zgrey-50" />
        <Skeleton className="w-40 h-40 bg-zgrey-50" />
        <Skeleton className="w-40 h-40 bg-zgrey-50" />
      </div>
    </div>
  );

  // for dynamic pages => ex: /consultant/3
  return (
    <div className="mx-5">
      <div className="flex flex-col items-end justify-center gap-3 my-5">
        <Skeleton className="w-40 h-5 bg-zgrey-50" />
        <Skeleton className="w-20 h-3 bg-zgrey-50" />
      </div>
      <Separator className="w-11/12 mx-auto" />
      <div className="flex flex-col items-end justify-center gap-3 my-5">
        <Skeleton className="w-20 h-2 bg-zgrey-50" />
        <Skeleton className="w-40 h-2 bg-zgrey-50" />
      </div>
      <Separator className="w-11/12 mx-auto" />
      <Skeleton className="w-80 h-20 bg-zgrey-50" />
      <Skeleton className="w-80 h-20 bg-zgrey-50" />
      <Separator className="w-11/12 mx-auto" />
      <div className="cflex">
        <Skeleton className="w-80 h-40 bg-zgrey-50" />
      </div>
    </div>
  );
}
