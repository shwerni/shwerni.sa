"use client";
// React & Next
import React from "react";

// components
import { Button } from "@/components/ui/button";
import { LoadingBtnEn } from "@/app/_components/layout/loadingBtn";
import { toast as sonner } from "sonner";

// prisma data
import { getPassedMeetingAdmin } from "@/data/admin/meeting";

// lib
import { meetingLabel } from "@/utils/moment";

export default function PassedBtn() {
  // on send
  const [isLoading, setLoading] = React.useState<boolean>(false);

  // press
  async function onPress() {
    try {
      // loading
      setLoading(true);
      // get data
      const data = await getPassedMeetingAdmin();
      // if data
      if (data) {
        // map meetings
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const meetings = data.map((m: any) => {
          if (!m?.meeting) return;

          return `
            رقم الطلب: ${m.oid}
            اسم العميل: ${m.name}
            رقم العميل: ${m.phone}
            واتس اب العميل: http://wa.me/${m.phone}
            المستشار: ${m.consultant}
            رقم الجلسة: ${m.meeting.session}
            ميعاد الحجز: ${meetingLabel(m.meeting.time, m.meeting.date)}
            ------------
            `;
        });
        // join them
        const text = meetings.join("");
        // copy
        navigator.clipboard.writeText(text);
        // success
        sonner.success("copied");
        // loading
        setLoading(false);
      } else {
        // error
        sonner.error("error has occurred");
        // loading
        setLoading(false);
      }
    } catch {
      // error
      sonner.error("error has occurred");
      // loading
      setLoading(false);
      // return
      return null;
    }
  }

  // return
  return (
    <Button className="zgreyBtn" onClick={() => onPress()}>
      <LoadingBtnEn loading={isLoading}>copy passed meetings</LoadingBtnEn>
    </Button>
  );
}
