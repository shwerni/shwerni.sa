"use client";
// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import TimingsTables from "@/app/_components/consultants/owner/timings/tables";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// utils
import { DaysAheadFromToday } from "@/utils/moment";

export default function OwnerTimings(props: { author: string; cid: number }) {
  // props
  const { author, cid } = props;

  // days
  const [days, setDays] = React.useState<
    { day: Weekday; date: string; label: string }[] | null
  >(null);

  // get days
  React.useEffect(() => {
    // data
    const data = DaysAheadFromToday(7);

    // set days
    if (data) setDays(data);
  }, []);

  // return
  return (
    <div className="flex flex-col gap-5 my-5">
      {!days ? (
        <div>
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
      ) : (
        <Tabs defaultValue={String(days[0]?.day)} dir="rtl">
          <TabsList className="grid grid-cols-4 gap-2 h-20 mdsm:grid-cols-7 mdsm:gap-0 mdsm:h-10 mx-auto">
            {days?.map((i) => (
              <TabsTrigger key={i.day} value={String(i.day)}>
                {i.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {days?.map((i) => (
            <TabsContent value={i.day} key={i.day}>
              <div className="my-5">
                {/* selected day title */}
                <h3>
                  يوم {i.label} الموافق {i.date}
                </h3>
                <h6>
                  ستنطبق هذة المواعيد علي يوم {i.label} من كل اسبوع الي حين
                  تغييرها
                </h6>
              </div>
              {/* timings tables */}
              <TimingsTables author={author} cid={cid} tday={i.day} />
              <h6 className="w-fit my-2 mx-auto">
                حفط هذه المواقيت ليوم {i.label}
              </h6>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
