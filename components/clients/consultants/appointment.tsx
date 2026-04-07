"use client";
// packages
import { useQueryState } from "nuqs";

// componenets
import DaysButtons from "./days-buttons";
import { Separator } from "@/components/ui/separator";

// utils
import { getDatesAhead, toNextHalfOrHour } from "@/utils/date";

// props
interface Props {
  initialDate: Date;
}

const Appointment = ({ initialDate }: Props) => {
  // get 7 days ahead
  const { iso } = toNextHalfOrHour(initialDate);

  // get 7 days ahead
  const days = getDatesAhead(7, iso);

  // date yyyy-mm-dd
  const [date, setDate] = useQueryState("date", {
    defaultValue: "",
    clearOnDefault: true,
    shallow: false,
  });

  return (
    <div className="py-5 space-y-5">
      {/* days picker */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {days.map((i, index) => (
          <div key={index} onClick={() => setDate(i)}>
            <DaysButtons day={i} selected={date === i} />
          </div>
        ))}
      </div>
      {/* separator */}
      <Separator className="xl:hidden max-w-3/4 mx-auto" />
    </div>
  );
};

export default Appointment;
