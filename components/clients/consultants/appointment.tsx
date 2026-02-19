"use client";
// packages
import { useQueryState } from "nuqs";

// componenets
import DaysButtons from "./days-buttons";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/shared/date-picker";
import { TimePicker } from "@/components/shared/time-picker";

// utils
import { getDatesAhead, toNextHalfOrHour } from "@/utils/date";

// props
interface Props {
  initialDate: Date;
}

const Appointment = ({ initialDate }: Props) => {
  // get 7 days ahead
  const { iso, time: newTime } = toNextHalfOrHour(initialDate);

  // get 7 days ahead
  const days = getDatesAhead(7, iso);

  // date yyyy-mm-dd
  const [date, setDate] = useQueryState("date", {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  });

  // time 24 time format
  const [time, setTime] = useQueryState("time", {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  });

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 xl:grid-cols-5  items-center justify-center gap-x-5 gap-y-4 pt-5 pb-3 px-3">
        {/* days picker */}
        <div className="col-span-3 flex flex-wrap items-center justify-center gap-2">
          {days.map((i, index) => (
            <div key={index} onClick={() => setDate(i)}>
              <DaysButtons day={i} selected={date === i} />
            </div>
          ))}
        </div>

        {/* time picker */}
        <div className="col-span-2 flex items-center justify-center gap-x-3">
          <div className="flex flex-col gap-1.5">
            <h5 className="text-[#094577] font-medium text-xs pr-1">التاريخ</h5>
            <DatePicker
              value={date || undefined}
              onChange={(value) => {
                setDate(value ?? null);
              }}
              minDate={days[0]}
              className="min-w-40"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <h5 className="text-[#094577] font-medium text-xs pr-1">الوقت</h5>
            <TimePicker
              value={time}
              onChange={(i) => setTime(i || null)}
              minTime={date === days[0] ? newTime : undefined}
            />
          </div>
        </div>
      </div>
      {/* separator */}
      <Separator className="xl:hidden max-w-3/4 mx-auto" />
    </div>
  );
};

export default Appointment;
