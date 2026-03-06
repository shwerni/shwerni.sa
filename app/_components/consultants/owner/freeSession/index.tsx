// React & Next
import React from "react";

// components
import { StatusToggle } from "./toggle";
import { getWeekStartSaturday } from "@/utils/moment";
import { timeZone } from "@/lib/site/time";

interface Props {
  cid: number;
  author: string;
  status: boolean | null | undefined;
  activeWeek: Date | null | undefined;
}

const OwnerFreeSessions: React.FC<Props> = async ({
  cid,
  status,
  activeWeek,
}) => {
  const { iso } = timeZone();

  const currentWeekStart = getWeekStartSaturday(iso);
  const isThisWeek = activeWeek?.getTime() === currentWeekStart.getTime();
  const initialStatus = (status && isThisWeek) ?? false;

  // return
  return (
    <div className="space-y-5">
      {/* toggle */}
      <div className="py-3 mx-5">
        <StatusToggle cid={cid} initialStatus={initialStatus} />
      </div>
    </div>
  );
};

export default OwnerFreeSessions;
