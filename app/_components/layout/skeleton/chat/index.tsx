import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

export default function ChatSkeleton() {
  return (
    <div className="flex flex-col gap-5 h-full py-10">
      {Array.from({ length: 7 }).map((i, index) => (
        <div key={index} className={index % 2 === 0 ? "flex justify-end" : ""}>
          <Skeleton className="w-44 h-9 bg-white" />
        </div>
      ))}
    </div>
  );
}
