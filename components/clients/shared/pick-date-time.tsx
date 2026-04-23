// React & Next
import React from "react";

// packages
import { ar } from "date-fns/locale";
import { addDays, format, isSameDay, startOfDay } from "date-fns";

// components
import DaysButtons from "./days-buttons";
import { Separator } from "@/components/ui/separator";

// lib
import { cn } from "@/lib/utils";
import { timeZone } from "@/lib/site/time";

// utils
import { timeOptions } from "@/utils";
import { dateToString } from "@/utils/time";
import { add25Minutes, dateToWeekDay, getDatesAhead } from "@/utils/date";

// prisma data
import { getConsultantAvailableTimes } from "@/data/consultant";

// icons
import { CalendarIcon, Clock, Moon, Sun, Sunrise, Sunset } from "lucide-react";

// props
interface Props {
  cid: number;
  unavailable: string[];
  daysAhead?: number;
  // Controlled State Props
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  selectedTime: string | undefined;
  setSelectedTime: (time: string | undefined) => void;
  availableTimes: Record<string, string[]> | undefined;
  setAvailableTimes: (times: Record<string, string[]> | undefined) => void;
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

export default function PickDateTime({
  cid,
  unavailable,
  daysAhead = 7,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  availableTimes,
  setAvailableTimes,
}: Props) {
  // loading
  const [loading, setLoading] = React.useState<boolean>(false);

  // date & time setup
  const { iso: initial } = timeZone();
  const {
    date: iso,
    iso: nDate,
    time,
  } = React.useMemo(() => {
    return add25Minutes(initial);
  }, [initial]);

  // get days ahead
  const days = getDatesAhead(daysAhead, nDate);

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
      setLoading(true);

      const data = await getConsultantAvailableTimes(
        cid,
        dateToString(date),
        dateToWeekDay(date),
        isSameDay(date, iso) ? time : undefined,
      );

      setAvailableTimes(data);
      setLoading(false);
    }
  }

  // Handle rendering of the time slots
  const renderTimeSlots = () => {
    if (loading) return <TimeSkeleton />;

    if (!selectedDate) {
      return (
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 text-theme h-fit">
          <CalendarIcon className="w-5 h-5 shrink-0" />
          <div className="flex flex-col">
            <p className="font-medium text-sm">اختر التاريخ أولاً</p>
            <p className="text-xs text-gray-700 font-medium">
              لتتمكن من رؤية المواعيد المتاحة، الرجاء اختيار تاريخ من التقويم
            </p>
          </div>
        </div>
      );
    }

    if (
      !availableTimes ||
      Object.values(availableTimes).every((t) => !t?.length)
    ) {
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
    }

    return (
      <div className="space-y-3">
        {Object.entries(availableTimes).map(([phase, phaseTimes]) => {
          if (!phaseTimes || phaseTimes.length === 0) return null;

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
                </div>
                <span className="text-xs text-gray-500">{meta.range}</span>
              </div>

              {/* times */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                {phaseTimes.map((t) => {
                  const option = timeByValue[t];
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedTime(t)}
                      className={cn(
                        "text-right text-gray-800 text-sm font-medium px-3 py-2 rounded-lg border transition-colors",
                        selectedTime === t
                          ? "bg-theme text-white border-theme hover:bg-theme/90"
                          : "bg-gray-100 hover:bg-theme hover:text-white",
                      )}
                    >
                      {option?.label || t}
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
  };

  return (
    <div className="flex flex-col gap-y-4">
      {/* calendar */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {days.map((i, index) => {
          const dateObj = new Date(i);
          const isDisabled =
            dateObj < startOfDay(iso) ||
            dateObj > addDays(iso, 10) ||
            unavailable.includes(dateToWeekDay(dateObj));

          return (
            <div
              key={index}
              onClick={() => {
                if (isDisabled) return;
                setSelectedDate(dateObj);
                setSelectedTime(undefined); // reset time on date change
                fetchTimes(dateObj);
              }}
              className={cn(
                isDisabled
                  ? "pointer-events-none opacity-35"
                  : "cursor-pointer",
              )}
            >
              <DaysButtons
                day={i}
                selected={
                  selectedDate ? dateToString(selectedDate) === i : false
                }
              />
            </div>
          );
        })}
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
      {renderTimeSlots()}
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
