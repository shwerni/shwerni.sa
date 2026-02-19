"use client";
import React from "react";

// components
import { Switch } from "@/components/ui/switch";
import { ZToast } from "@/app/_components/layout/toasts";

// prisma data
import { toggleFreesessionState } from "@/data/freesession";

// utils
import { isActiveWeekValid } from "@/utils/moment";

// props
interface Props {
  author: string;
  cid: number;
  initialStatus: boolean;
  activeWeek: Date;
}

export const StatusToggle: React.FC<Props> = ({
  author,
  initialStatus,
  activeWeek,
  cid,
}) => {
  // Get Friday as start of the week (week starts on Friday)
  const isActiveWeek = isActiveWeekValid(activeWeek);

  const [status, setStatus] = React.useState(initialStatus && isActiveWeek);
  const [pending, startTransition] = React.useTransition();

  const handleToggle = () => {
    const newStatus = !status;
    setStatus(newStatus);

    startTransition(async () => {
      toggleFreesessionState(author, cid, newStatus).then((response) => {
        if (!response) {
          ZToast({ state: false, message: "فشل التحديث" });
          setStatus(!newStatus);
        } else {
          ZToast({ state: true, message: "تم التحديث بنجاح" });
        }
      });
    });
  };

  return (
    <div className="flex items-center gap-2">
      <h3>تفعيل الجلسات المجانية</h3>
      <Switch
        dir="ltr"
        checked={status}
        onCheckedChange={handleToggle}
        disabled={pending}
      />
    </div>
  );
};
