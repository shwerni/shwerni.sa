// React & Next
import React from "react";

// pacakges
import { ar } from "date-fns/locale";
import { Controller, type UseFormReturn } from "react-hook-form";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

// components../../../shared/days-buttons
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IconLabel } from "@/components/shared/icon-label";
import DaysButtons from "@/components/clients/shared/days-buttons";
import CurrencyLabel from "@/components/clients/shared/currency-label";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { cn } from "@/lib/utils";
import { add25Minutes, dateToWeekDay, getDatesAhead } from "@/utils/date";

// schema
import { ReservationFormType } from "@/schemas";

// prisma data
import { getConsultantAvailableTimes } from "@/data/consultant";

// types
import { Cost } from "@/types/data";

// utils
import { timeOptions } from "@/utils";
import { dateToString } from "@/utils/time";

// icons
import {
  CalendarIcon,
  ChevronLeft,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
} from "lucide-react";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
  onNext: () => void;
}

// phase meta data
const phaseMeta = {
  late: {
    label: "منتصف الليل",
    Icon: Moon,
    range: "12:00 ص - 4:30 م",
    style: "text-gray-500",
  },
  day: {
    label: "الصباح",
    Icon: Sunrise,
    range: "04:30 ص - 12:00 م",
    style: "text-yellow-500",
  },
  noon: {
    label: "الظهيرة",
    Icon: Sun,
    range: "12:00 م - 06:00 م",
    style: "text-amber-500",
  },
  night: {
    label: "المساء",
    Icon: Sunset,
    range: "06:00 م - 12:00 ص",
    style: "text-black",
  },
} as const;

export default function StepDateTime({ form, onNext }: Props) {
  // control
  const { control } = form;

  // cid & unavailable
  const { cid, unavailable } = form.getValues();

  // loading
  const [loading, setLoading] = React.useState<boolean>(false);

  // date
  const { iso: initial } = timeZone();
  // time
  const {
    date: iso,
    iso: nDate,
    time,
  } = React.useMemo(() => {
    return add25Minutes(initial);
  }, [initial]);

  // get 7 days ahead
  const days = getDatesAhead(7, nDate);

  // times
  const times = form.watch("times");

  // selected date
  const selectedDate = form.watch("date");

  // selected time
  const selectedTime = form.watch("time");

  // find time label and phase
  const timeByValue = React.useMemo(
    () =>
      Object.fromEntries(
        timeOptions.map((t) => [t.value, { label: t.label, phase: t.phase }]),
      ),
    [],
  );

  async function fetchTimes(date: Date | undefined) {
    if (date) {
      // loading
      setLoading(true);

      // data
      const data = await getConsultantAvailableTimes(
        cid,
        dateToString(date),
        dateToWeekDay(date),
        isSameDay(date, iso) ? time : undefined,
      );

      // update times
      form.setValue("times", data, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      });

      // loading
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-y-4">
      {/* calendar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {days.map((i, index) => (
          <div
            key={index}
            onClick={() => {
              form.setValue("date", new Date(i));
              // @ts-expect-error - this is a hack to reset time when date changes
              //form.setValue("time", undefined);
              // get this day times
              fetchTimes(new Date(i));
            }}
            className={cn(
              new Date(i) < startOfDay(iso) ||
                new Date(i) > addDays(iso, 10) ||
                unavailable.includes(dateToWeekDay(new Date(i)))
                ? "pointer-events-none opacity-35"
                : "",
            )}
          >
            <DaysButtons day={i} selected={dateToString(selectedDate) === i} />
          </div>
        ))}
      </div>

      {/* date label */}
      {selectedDate && (
        <h5 className="text-sm font-medium text-[#094577]">
          {format(selectedDate, "EEEE، d MMMM yyyy", {
            locale: ar,
          })}
        </h5>
      )}

      {/* time slots */}
      <Controller
        name="time"
        control={control}
        render={({ field }) => {
          if (loading) return <TimeSkeleton />;

          if (!selectedDate)
            return (
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 text-theme h-fit">
                <CalendarIcon className="w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <p className="font-medium text-sm">اختر التاريخ أولاً</p>
                  <p className="text-xs text-gray-700 font-medium">
                    لتتمكن من رؤية المواعيد المتاحة، الرجاء اختيار تاريخ من
                    التقويم
                  </p>
                </div>
              </div>
            );

          // no times
          if (!times || Object.values(times).every((t) => !t?.length))
            return (
              <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50 text-red-700 h-fit">
                <Clock className="w-5 h-5 shrink-0" />
                <div className="flex flex-col">
                  <p className="font-medium text-sm">لا توجد مواعيد متاحة</p>
                  <p className="text-xs text-red-600/80 font-medium">
                    للأسف، لا توجد مواعيد متاحة لهذا اليوم. حاول اختيار يوم آخر.
                  </p>
                </div>
              </div>
            );

          return (
            <div className="space-y-3">
              {Object.entries(times).map(([phase, phaseTimes]) => {
                if (!phaseTimes || phaseTimes.length === 0) return;

                const meta = phaseMeta[phase as keyof typeof phaseMeta];

                return (
                  <div
                    key={phase}
                    className="border-none transition-colors duration-300 space-y-3 my-3"
                  >
                    {/* phase header */}
                    <div className="inline-flex justify-between items-center w-full">
                      <div className="inline-flex items-center gap-1.5">
                        <meta.Icon className={cn(meta.style, "w-5")} />
                        <h4 className="text-gray-700 text-sm font-medium">
                          {meta.label}
                        </h4>
                        {/* <span className="text-xs text-gray-600 font-medium">({phaseTimes.length})</span> */}
                      </div>
                      <span className="text-xs text-gray-500">
                        {meta.range}
                      </span>
                    </div>

                    {/* times */}
                    <div className="flex flex-wrap gap-2.5 pt-2">
                      {phaseTimes.map((t) => {
                        const option = timeByValue[t];
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => field.onChange(t)}
                            className={cn(
                              "text-right text-gray-800 text-sm font-medium px-3 py-2 rounded-lg border transition-colors",
                              selectedTime === t
                                ? "bg-theme text-white border-theme hover:bg-theme/90"
                                : "bg-gray-100 hover:bg-theme hover:text-white",
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* seperator */}
                    <Separator className="w-10/12 max-w-80 mx-auto mt-10" />
                  </div>
                );
              })}
            </div>
          );
        }}
      />

      <div className="flex items-center justify-between col-span-3">
        <Button variant="primary" type="button" onClick={onNext} size="sm">
          <IconLabel
            Icon={ChevronLeft}
            label="الخطوة التالية"
            className="text-sm"
          />
        </Button>

        <div className="flex flex-col items-center justify-center gap-2 ">
          <CurrencyLabel
            amount={
              form.getValues("cost")[form.getValues("duration") as keyof Cost]
            }
            tax={15}
            textStyle="text-theme font-semibold"
          />
          <span className="text-sm font-semibold">تكلفة الجلسة</span>
        </div>
      </div>
    </div>
  );
}

function TimeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-9 w-full rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}
