"use client";
// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import { SkeltonTimings } from "@/app/_components/layout/skeleton/timings";

// utils
import { addMinutesToNow, meetingLabel } from "@/utils/moment";

// prisma data
import { getTimingsReservation } from "@/data/timings";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";


// types
import { Times } from "@/types/admin";

// constants
import { itimes } from "@/constants";

// icons
import { TbSunset2 } from "react-icons/tb";
import { Clock, Moon, MoonStar, Sun } from "lucide-react";

// props
interface Props {
  cid: number;
  date: string;
  tday: Weekday;
  time: string | null;
  setTime: React.Dispatch<React.SetStateAction<string | null>>;
  setDate: React.Dispatch<React.SetStateAction<string | null>>;
}

export default function TimingsTable({
  cid,
  date,
  tday,
  time,
  setTime,
  setDate,
}: Props) {
  // loading
  const [isLoading, startLoading] = React.useTransition();

  // times
  const [times, setTimes] = React.useState<string[] | null>(null);

  // time label
  const [label, setLabel] = React.useState<string | null>(null);

  // grouped filtered times
  const filtered = times
    ? Object.entries(itimes)
      .filter(([key]) => times.includes(key))
      .map(([key, { label, phase }]) => ({
        value: key,
        label,
        phase,
      }))
    : [];


  // after 00:00
  const late = filtered.filter((t) => t.phase === "late");
  // dawn
  const day = filtered.filter((t) => t.phase === "day");
  // afternoon
  const afternoon = filtered.filter((t) => t.phase === "noon");
  // night
  const night = filtered.filter((t) => t.phase === "night");

  // get times
  async function getTimings() {
    // time
    const { time, date: today } = addMinutesToNow();

    // get
    const data = await getTimingsReservation(cid, today, time, tday, date,);

    // data
    setTimes(data);
  }
  // use effect to get times on refresh
  React.useEffect(() => {
    startLoading(() => {
      // get owner times by cid
      getTimings();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle selection
  function handleSelection(ntime: string) {
    // update label instantly for user  experience
    setLabel(null);
    // update times
    setTime(ntime);
    // check date
    setDate(date);
    // new label
    const nlabel = meetingLabel(ntime, date);
    // update label
    setLabel(nlabel ? nlabel : "حدث خطأ ما");
  }

  // time layout
  const TimesLayout = (
    timings: Times[],
    title: string,
    color: string,
    Icon: React.ReactNode
  ) => {
    return (
      <div>
        {/* title */}
        <h3 className={`flex items-center gap-1 ${color}`}>
          {Icon}
          {title}
        </h3>
        {/* late */}
        <div className="grid justify-center justify-items-center grid-cols-1 xstmd:grid-cols-2 mdtsm:grid-cols-3 sm:grid-cols-4 zhead:grid-cols-5 gap-5 my-5">
          {timings.map((i, index) => (
            <div
              key={index}
              className={`${time === i.value ? "bg-green-500" : "bg-slate-200"
                } w-28 py-2 px-3 rounded-lg transition-all duration-300`}
              onClick={() =>
                handleSelection(i.value)
              }
            >
              <h3
                className={`${time === i.value ? "text-white" : "text-black"
                  } text-base text-center transition-all duration-300`}
              >
                {i.label}
              </h3>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // loading
  if (isLoading) return <SkeltonTimings />;

  // if there are no timings for this day
  if (!isLoading && (!times || times.length === 0))
    return (
      <div>
        <div className="cflex w-fit min-h-40 my-10 mx-auto sm:px-10 rounded-xl">
          <h3 className="text-red-500 text-center">
            لا يوجد مواعيد متاحة لهذا المستشار
          </h3>
          <h5 className="text-center">
            المستشار لا يوجد لدية مواقيت متاحة هذا اليوم للحجز
          </h5>
        </div>
      </div>
    );

  // return
  return (
    <div className="space-y-5 mt-10">
      <h3 className="flex flex-row gap-1 text-zblue-200">
        <Clock className="w-5" />
        اختر موعد الاستشارة
      </h3>
      <div className="flex flex-col gap-5">
        {/* late */}
        {late.length !== 0 && (
          <>
            {TimesLayout(late, "منتصف الليل", "text-zblack-100", <MoonStar />)}
            {/* separator */}
            <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
          </>
        )}
        {/* day */}
        {day.length !== 0 && (
          <>
            {TimesLayout(day, "صباحا", "text-orange-500", <Sun />)}
            {/* separator */}
            <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
          </>
        )}
        {/* afternoon */}
        {afternoon.length !== 0 && (
          <>
            {TimesLayout(
              afternoon,
              "الظهيرة",
              "text-amber-500",
              <TbSunset2 className="text-2xl" />
            )}
            {/* separator */}
            <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
          </>
        )}
        {/* night */}
        {night.length !== 0 &&
          TimesLayout(night, "مساءً", "text-grey-100", <Moon />)}
        {/* when the reservation label */}
        <div
          className={`${label ? "opacity-100" : "opacity-0"
            } sm:max-w-fit max-w-60 sm:w-full h-10 transition-all duration-1000 ease-linear`}
        >
          <h5 className="text-sm">{label ?? ""}</h5>
        </div>
      </div>
    </div>
  );
}
