// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ZToast } from "@/app/_components/layout/toasts";

// handlers
import { saveTimings } from "@/handlers/conusltant/owner/timings";

// prisma data
import { getTimings } from "@/data/timings";

// prsima types
import { Weekday } from "@/lib/generated/prisma/enums";

// constants
import { itimes } from "@/constants";

// icons
import { TbSunset2 } from "react-icons/tb";
import { Moon, MoonStar, Save, Sun } from "lucide-react";

// table
const TimingsTables = React.memo(function TimingsTables(props: {
  author: string;
  cid: number;
  tday: Weekday;
}) {
  // props
  const { tday, cid, author } = props;
  // sending
  const [isSending, startSending] = React.useTransition();
  // sending
  const [isLoading, startLoading] = React.useTransition();
  // selections
  const [times, setTimes] = React.useState<string[]>([]);
  // itimes to an array
  const timesA = Object.entries(itimes).map(([value, meta]) => ({
    value,
    label: meta.label,
    phase: meta.phase,
  }));
  // after 00:00
  const late = timesA.slice(0, 8);
  // dawn
  const day = timesA.slice(8, 24);
  // afternoon
  const afternoon = timesA.slice(24, 32);
  // night
  const night = timesA.slice(32, 48);

  // use effect
  React.useEffect(() => {
    startLoading(() => {
      getTimings(author, cid, tday).then((response) => {
        if (response) setTimes(response);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle selection
  function handleSelection(time: string) {
    // current times
    let ctimes = [...times];
    // push if not exist , remove if exist
    if (ctimes.includes(time)) {
      ctimes = ctimes.filter((i) => i !== time);
    } else {
      ctimes.push(time);
    }
    // update times
    setTimes([...ctimes]);
  }
  // on submit
  function onSubmit() {
    // useTransition
    startSending(() => {
      // handle update owner time
      saveTimings(author, cid, tday, times).then((response) => {
        // toast the return state
        if (response?.message) {
          ZToast(response);
        }
      });
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
    Icon: React.ReactNode,
  ) => {
    return (
      <div>
        {/* title */}
        <h3 className={`flex items-center gap-1 ${color}`}>
          {Icon}
          {title}
        </h3>
        {/* late */}
        <div className="grid justify-center justify-items-center grid-cols-2 sm:grid-cols-3 zhead:grid-cols-4 lg:grid-cols-5! gap-5 sm:mx-5 my-5">
          {timings.map((i, index) => (
            <div
              key={index}
              className={`${
                times.includes(i.value) ? "bg-green-500" : "bg-zblue-100"
              } w-28 py-2 px-3 rounded-lg transition-all duration-300`}
              onClick={() => handleSelection(i.value)}
            >
              <h3
                className={`${
                  times.includes(i.value) ? " " : ""
                } text-black text-base text-center transition-all duration-300`}
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
    <div
      className={`${
        isSending || isLoading ? "opacity-35 pointer-events-none" : ""
      }`}
    >
      <div className="flex flex-col gap-5 my-5">
        {/* late */}
        {TimesLayout(late, "منتصف الليل", "text-zgrey-200", <MoonStar />)}
        {/* separator */}
        <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
        {/* day */}
        {TimesLayout(day, "صباحا", "text-orange-500", <Sun />)}
        {/* separator */}
        <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
        {/* afternoon */}
        {TimesLayout(
          afternoon,
          "الظهيرة",
          "text-amber-500",
          <TbSunset2 className="text-2xl" />,
        )}
        {/* separator */}
        <Separator className="w-3/5 h-1 bg-zgrey-100 mx-auto rounded-lg" />
        {/* night */}
        {TimesLayout(night, "ليلا", "text-grey-100", <Moon />)}
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

export default TimingsTables;
