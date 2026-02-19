// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function loading() {
  return (
    <div className="min-h-72 space-y-10">
      <Skeleton className="w-60 h-10 bg-zgrey-50" />
      <div className="space-y-10">
        {Array(5)
          .fill(null)
          .map((i, index) => (
            <div key={index} className="flex items-center gap-5">
              <Skeleton className="w-20 h-20 bg-zgrey-50" />
              <Skeleton className="w-20 h-20 bg-zgrey-50" />
              <Separator className="w-11/12 max-w-56 mx-auto"/>
            </div>
          ))}
      </div>
      <Skeleton className="w-60 h-10 bg-zgrey-50" />
    </div>
  );
}
