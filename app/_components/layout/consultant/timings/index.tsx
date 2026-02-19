"use client";
// React & Next
import React from "react";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SkeltonTimings } from "@/app/_components/layout/skeleton/timings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TimingsTable from "@/app/_components/layout/consultant/timings/timings";

// utils
import { DaysAheadFromToday } from "@/utils/moment";

// types
import { Days } from "@/types/types";

// icons
import { CalendarDays } from "lucide-react";

// props
interface Props {
  cid: number;
  time: string | null;
  title?: string;
  subTitle?: string;
  setTime: React.Dispatch<React.SetStateAction<string | null>>;
  setDate: React.Dispatch<React.SetStateAction<string | null>>;
  daysAhead?: number;
}

export default function ConsultantTimings({
  cid,
  time,
  setTime,
  setDate,
  title,
  subTitle,
  daysAhead,
}: Props) {
  // days
  const [days, setDays] = React.useState<Days[] | null>(null);

  // on load
  React.useEffect(() => {
    const data = DaysAheadFromToday(daysAhead ?? 4);
    setDays(data);
  }, [daysAhead]);

  return (
    <Card className="space-y-2">
      <CardHeader>
        <CardTitle>{title ?? ""}</CardTitle>
        <CardDescription>{subTitle ?? ""}</CardDescription>
      </CardHeader>
      <CardContent>
        {!days ? (
          <SkeltonTimings />
        ) : (
          <div className="sapce-y-2">
            <div className="space-y-3">
              <h3 className="flex flex-row gap-1 text-zblue-200">
                <CalendarDays />
                اختر اليوم
              </h3>
              {/* timings table */}
              <Tabs defaultValue={String(days[0].day)} dir="rtl">
                <TabsList
                  className={`grid grid-cols-${daysAhead ?? 4} mx-auto`}
                >
                  {days?.map((i) => (
                    <TabsTrigger
                      key={i.day}
                      value={String(i.day)}
                      onClick={() => {
                        // update date
                        setDate(i.date);
                        // reset time
                        setTime(null);
                      }}
                    >
                      {i.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {days?.map((i, index) => (
                  <TabsContent value={String(i.day)} key={index}>
                    <div className="my-5">
                      {/* selected day title */}
                      <h3 className="text-base">
                        يوم {i.label} الموافق {i.date}
                      </h3>
                    </div>
                    {/* timings tables */}
                    <TimingsTable
                      cid={Number(cid)}
                      date={i.date}
                      tday={i.day}
                      time={time}
                      setTime={setTime}
                      setDate={setDate}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
