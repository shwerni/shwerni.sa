"use client";
// React & Next
import React from "react";

// pacakges
import { HMSRoomProvider } from "@100mslive/react-sdk";

// components
import NavLinks from "@/components/shared/links";
import Section from "@/components/clients/shared/section";

// prisma types
import { Meeting } from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { meetingLabel, meetingTime } from "@/utils/time";

// icons
import { AlertTriangle } from "lucide-react";

// props
interface HMSLayoutProps {
  meeting: Meeting;
  children: React.ReactNode;
}

export default function HMSLayout({ children, meeting }: HMSLayoutProps) {
  // time and date
  const { time, date } = timeZone();

  // after limit
  const after = Number(meeting.duration) + 15;

  // is time available
  const isAvailable = meetingTime(
    time,
    date,
    meeting.time,
    meeting.date,
    -5,
    after,
  );

  // validate
  if (!isAvailable) {
    return (
      <Section>
        <div className="w-full flex flex-col items-center justify-center py-20 space-y-4 text-center text-red-600">
          <AlertTriangle className="w-12 h-12" />
          <h2 className="text-xl font-bold">الإجتماع غير متاح حالياً</h2>
          <p className="text-sm max-w-md text-gray-700 dark:text-gray-300">
            لا يمكنك الدخول إلى غرفة الإجتماع الآن. تبدأ الجلسة{" "}
            <span className="font-bold"> {meeting.orderId}# </span>قبل الموعد بـ
            5 دقائق وتستمر لمدة 15 دقيقة فقط بعد إنتهاء الإجتماع. يرجى العودة في
            الوقت المناسب.
          </p>
          <span>{meetingLabel(meeting.time, meeting.date)}</span>
          <NavLinks />
        </div>
      </Section>
    );
  }

  return <HMSRoomProvider>{children}</HMSRoomProvider>;
}
