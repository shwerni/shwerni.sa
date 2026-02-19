// React & Next
import React from "react";

// components
import { StatusToggle } from "./toggle";
import ErrorRefresh from "@/app/_components/layout/zErrors/site/refresh";
import SessionsTables from "@/app/_components/consultants/owner/freeSession/tables";

// utils
import { TargetDayDate } from "@/utils/moment";

// prisma data
import { getOwnerFreeSessionTimings } from "@/data/freesession";

// icons
import { Clock } from "lucide-react";

interface Props {
  cid: number;
  author: string;
  status: boolean | null | undefined;
  activeWeek: Date | null | undefined;
}

const OwnerFreeSessions: React.FC<Props> = async ({
  author,
  cid,
  status,
  activeWeek,
}) => {
  // target day (5 friday)
  const day = await TargetDayDate(5);

  // initial times
  const times = await getOwnerFreeSessionTimings(cid);

  // if day not exist
  if (!day) return <ErrorRefresh />;

  // return
  return (
    <div className="space-y-5">
      {/* toggle */}
      <div className="py-3 mx-5">
        <StatusToggle
          cid={cid}
          initialStatus={status ?? false}
          author={author}
          activeWeek={activeWeek ?? new Date()}
        />
      </div>
      {/* timings */}
      <div className="bg-zgrey-50 rounded-xl p-5 min-w-60 max-w-2xl mx-auto">
        {/* title */}
        <div className="flex flex-col gap-1">
          <h3 className="flex flex-row items-center gap-1 text-zblue-200 font-bold text-2xl text-right">
            <Clock /> اختيار موعد
          </h3>
          <h6 dir="rtl" className="text-zgrey-100 text-sm font-semibold mb-3">
            برجاء اختيار ميعاد واحد فقط
          </h6>
          {/* map times */}
        </div>
        {/* times */}
        <div>
          {/* selected day title */}
          <h3>
            يوم {day.label} الموافق {day.date}
          </h3>
          <h6>
            ستنطبق هذة المواعيد علي يوم {day.label} من كل اسبوع الي حين تغييرها
          </h6>
        </div>
        {/* timings tables */}
        <SessionsTables
          author={author}
          cid={cid}
          targetDay="day5"
          itime={times}
        />
        <h6 className="w-fit my-2 mx-auto">
          حفط هذه المواقيت ليوم {day.label}
        </h6>
        {/* hint */}
        <h6 dir="rtl" className="text-xs text-zgrey-100">
          المواعيد بتوقيت الرياض - المملكة العربية السعودية
        </h6>
        {/* confirm picking */}
      </div>
    </div>
  );
};

export default OwnerFreeSessions;
