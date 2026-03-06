"use client";
// React & Next
import React from "react";

// components
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/shared/toast";

// prisma data
import { toggleFreesessionState } from "@/data/freesession";

// props
interface Props {
  cid: number;
  initialStatus: boolean;
}

export const StatusToggle: React.FC<Props> = ({ initialStatus, cid }) => {
  const [status, setStatus] = React.useState(initialStatus);
  const [pending, startTransition] = React.useTransition();

  const handleToggle = () => {
    const newStatus = !status;
    setStatus(newStatus);

    startTransition(async () => {
      toggleFreesessionState(cid, newStatus).then((response) => {
        if (!response) {
          toast.info({ message: "فشل التحديث" });
          setStatus(!newStatus);
        } else {
          toast.success({ message: "تم التحديث بنجاح" });
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