"use client";
// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/app/_components/layout/toasts";

// handles
// import { saveOwnersTimings } from "@/app/_handlers/conusltant/owner/timings";

// prisma data
import { saveOwnerFreeSessionTimings } from "@/data/freesession";

// types
import { DayKeys } from "@/types/types";

// constants
import { itimes } from "@/constants";

// icons
import { TbSunset2 } from "react-icons/tb";
import { Moon, Save, Sun } from "lucide-react";


// props
interface Props {
  author: string;
  cid: number;
  targetDay: DayKeys;
  itime: string | null;
}

// table
const SessionsTables: React.FC<Props> = React.memo(function SessionsTables({
  author,
  cid,
  targetDay,
  itime,
}) {
  // sending
  const [isSending, startSending] = React.useTransition();
  // selections
  const [times, setTimes] = React.useState<string | null>(itime);
  // itimes to an array
  const timesA = Object.entries(itimes).map(([value, meta]) => ({
    value,
    label: meta.label,
    phase: meta.phase,
  }));
  // dawn
  const day = timesA.slice(8, 24);
  // afternoon
  const afternoon = timesA.slice(24, 32);
  // night
  const night = timesA.slice(32, 48);
  // handle selection
  function handleSelection(t: string) {
    // update times
    setTimes(t);
  }

  // on submit
  function onSubmit() {
    // useTransition
    startSending(() => {
      // handle register fields submited data
      if (times)
        saveOwnerFreeSessionTimings(author, cid, times).then(
          (response) => {
            // toast the return state
            if (response) {
              ZToast({ state: true, message: "تم حفظ التغييرات بنجاح" });
            } else {
              ZToast({ state: false, message: "حدث خطأ ما" });
            }
          }
        );
    });
  }

  // time layout
  const TimesLayout = (
    timings: {
      label: string;
      value: string;
    }[],
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
        <div className="grid justify-center justify-items-center grid-cols-2 sm:grid-cols-3 gap-5 sm:mx-5 my-5">
          {timings.map((i, index) => (
            <div
              key={index}
              className={`${times === i.value ? "bg-green-500" : "bg-zblue-100"
                } w-28 py-2 px-3 rounded-lg transition-all duration-300`}
              onClick={() => handleSelection(i.value)}
            >
              <h3
                className={`${times === (i.value) ? "text-white" : ""
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

  return (
    <div className={`${isSending ? "opacity-35 pointer-events-none" : ""}`}>
      <div className="flex flex-col gap-5 my-5">
        {/* day */}
        {TimesLayout(day.slice(4, 7), "صباحا", "text-orange-500", <Sun />)}
        {/* separator */}
        <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
        {/* afternoon */}
        {TimesLayout(
          afternoon.slice(0, 3),
          "الظهيرة",
          "text-amber-500",
          <TbSunset2 className="text-2xl" />
        )}
        {/* separator */}
        <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
        {/* night */}
        {TimesLayout(night.slice(6, 9), "ليلا", "text-grey-100", <Moon />)}
      </div>
      {/* save & submit */}
      <div className="cflex">
        <Button
          className="gap-1 w-fit bg-zblue-200 mx-auto"
          disabled={isSending}
          onClick={onSubmit}
        >
          حفظ الاختيارات
          <Save />
        </Button>
      </div>
    </div>
  );
});

export default SessionsTables;
