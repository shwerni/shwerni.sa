"use client";
// React & Next
import React from "react";

// components
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// utils
import { isEnglish } from "@/utils";

// prisma data
import { statisticsgetToday } from "@/data/admin/statistics";

// types
import { Lang } from "@/types/types";
import { DatePickerRange } from "../../datePicker/range";
import { DateRange } from "react-day-picker";

// today type
interface TodayData {
  user: number;
  owner: number;
  preConsultation: number;
  orders: number;
  reviews: number;
  scheduled: number;
  instant: number;
}

// props
interface Props {
  date: string;
  data: TodayData;
  lang?: Lang;
}

export default function StatisticsToday({ date, data, lang }: Props) {
  // check lang
  const isEn = isEnglish(lang);

  // transisit
  const [onSend, startSending] = React.useTransition();

  // date
  const [range, setRange] = React.useState<DateRange>({
    from: new Date(date),
    to: new Date(date),
  });

  // data
  const [reports, setReports] = React.useState<TodayData>(data);

  // statistics card
  const StatisticsCard = (
    label: string,
    value: number | undefined,
    Icon?: React.ReactNode | string
  ) => {
    return (
      <Card className="cflex w-fit min-w-24 px-2 sm:px-3 py-2 gap-1">
        <div className="rflex gap-3">
          <h3 className="pt-1">{value}</h3>
          {Icon}
        </div>
        <h6 className="text-center">{label}</h6>
      </Card>
    );
  };

  // when date change
  React.useEffect(() => {
    startSending(() => {
      if (range.from && range.to)
        statisticsgetToday(range.from, range.to).then((response) => {
          if (response) {
            setReports(response);
          }
        });
    });
  }, [range]);

  // return
  return (
    <>
      <div className="flex items-center justify-between">
        {/* header */}
        <h3>{isEn ? "period statistics" : "إحصائيات بالتاريخ"}</h3>
        {/* date picker */}
        <DatePickerRange
          range={range}
          setRange={setRange}
          lang={lang}
        />
      </div>
      <div className="space-y-5">
        {/* today */}
        {onSend ? (
          <h3 className="w-fit py-10 mx-auto">loading...</h3>
        ) : (
          <div className="grid grid-cols-3 gap-5 sm:mx-3">
            {StatisticsCard(isEn ? "paid order" : "طلب ناجح", reports.orders)}
            {StatisticsCard(isEn ? "instant" : "حجز فوري", reports.instant)}
            {StatisticsCard(
              isEn ? "scheduled" : "حجز مجدول",
              reports.scheduled
            )}
            {StatisticsCard(isEn ? "new user" : "عميل جديد", reports.user)}
            {StatisticsCard(isEn ? "new owner" : "مستشار جديد", reports.owner)}
            {StatisticsCard(
              isEn ? "new review" : "تعليق جديد",
              reports.reviews
            )}
            {StatisticsCard(
              isEn ? "new pre consultation" : "جلسة توجيهية",
              reports.preConsultation
            )}
          </div>
        )}
        {/* separator */}
        <Separator className="w-3/4 mx-auto my-2" />
      </div>
    </>
  );
}
