"use client";
// React & Next
import React from "react";

// components
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimingsTablesAdmin from "@/app/_components/management/admin/timings/Tables";

// prisma types
import { Weekday } from  "@/lib/generated/prisma/enums";

// utils
import { DaysAheadEn } from "@/utils/moment";

// props
interface Props {
  cid: number;
  author: string;
}

export default function OwnerTimingsAdmin({ author, cid }: Props) {
  // loading or pending
  const [isLoading, startLoading] = React.useTransition();

  // days
  const [days, setDays] = React.useState<
    { day: Weekday; date: string; label: string }[] | null
  >(null);

  // get days
  React.useEffect(() => {
    startLoading(() => {
      DaysAheadEn(7).then((response) => {
        if (response) setDays(response);
      });
    });
  }, []);

  // return
  return (
    <div className="flex flex-col gap-5 my-5">
      {isLoading || !days ? (
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
        <Tabs defaultValue={String(days[0]?.day)}>
          <TabsList className="grid grid-cols-4 gap-2 h-20 mdsm:grid-cols-7 mdsm:gap-0 mdsm:h-10 mx-auto">
            {days?.map((i) => (
              <TabsTrigger key={i.day} value={String(i.day)}>
                {i.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {days?.map((i) => (
            <TabsContent value={String(i.day)} key={i.day}>
              <div className="my-5">
                {/* selected day title */}
                <h3>
                  {i.label} | {i.date}
                </h3>
              </div>
              {/* timings tables */}
              <TimingsTablesAdmin tday={i.day} cid={cid} author={author} />
              <h6 className="w-fit my-2 mx-auto">
                save this timings for {i.label}
              </h6>
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
}
