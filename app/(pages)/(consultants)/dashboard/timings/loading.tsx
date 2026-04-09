// React & Next
import React from "react";
// components
import { Skeleton } from "@/components/ui/skeleton";
import { Btitle } from "@/components/legacy/layout/titles";
import { Section } from "@/components/legacy/layout/section";

// icons
import { Clock } from "lucide-react";

export default async function Loading() {
  return (
    <Section>
      {/* title */}
      <Btitle
        title="المواقيت"
        subtitle="مواقيت الاستشارات المتوقع التواجد فيها"
      />
      {/* timings */}
      <div className="bg-zgrey-50 rounded-xl p-5 mx-2 min-w-[240px]">
        {/* title */}
        <div className="flex flex-col gap-1">
          <h3 className="flex flex-row items-center gap-1 text-zblue-200 font-bold text-2xl text-right">
            <Clock /> اختيار المواقيت
          </h3>
          <h6 dir="rtl" className="text-zgrey-100 text-sm font-semibold mb-3">
            برجاء اختيار المواعيد المناسبة معك اليوم{" "}
          </h6>
          {/* map times */}
        </div>
        <div className="flex flex-col gap-5 my-5">
          <Skeleton className="w-40 h-5" />
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
            <div className="rflex gap-10">
              <Skeleton className="w-28 h-10" />
              <Skeleton className="w-28 h-10" />
            </div>
            <Skeleton className="w-20 h-7" />
          </div>
        </div>
        {/* hint */}
        <h6 dir="rtl" className="text-xs text-zgrey-100">
          المواعيد بتوقيت الرياض - المملكة العربية السعودية
        </h6>
        {/* confirm picking */}
      </div>
    </Section>
  );
}
