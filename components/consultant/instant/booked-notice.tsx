"use client";
// React & Next
import Link from "next/link";
import { useEffect } from "react";

// packages
import { formatInTimeZone } from "date-fns-tz";

// utils
import { timeLabel } from "@/utils/date";

// constants
import { mainRoute } from "@/constants/links";

// types
import type { InstantBooked } from "@/hooks/realtime/useOnlineConsultant";

// icons
import { Video } from "lucide-react";

const SOUND = "/audio/meeting-join.mp3";
const TITLE = "🔔 لديك جلسة فورية الآن";

// a paid instant session arrived: a full-screen notice with a sound, the consultant's meeting
// link and a way back to the dashboard
export function InstantBookedNotice({ booked }: { booked: InstantBooked }) {
  // the start in riyadh time, e.g. "03:15 مساءً"
  const starts = Date.parse(booked.startsAt);
  const startsAt = Number.isFinite(starts)
    ? timeLabel(formatInTimeZone(new Date(starts), "Asia/Riyadh", "HH:mm"))
    : null;

  // the link comes over the socket: only the site's own meeting links
  const joinUrl = booked.meetingUrl.startsWith(mainRoute)
    ? booked.meetingUrl
    : "/dashboard";

  // the sound (a blocked autoplay plays on the first tap), a vibration on phones, the tab title
  useEffect(() => {
    const audio = new Audio(SOUND);
    const playOnTap = () => void audio.play().catch(() => {});
    audio
      .play()
      .catch(() =>
        window.addEventListener("pointerdown", playOnTap, { once: true }),
      );
    navigator.vibrate?.([300, 150, 300]);

    const title = document.title;
    document.title = TITLE;

    return () => {
      window.removeEventListener("pointerdown", playOnTap);
      audio.pause();
      document.title = title;
    };
  }, []);

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white p-6 text-center"
    >
      {/* green pulsing video icon */}
      <span className="relative flex h-20 w-20 items-center justify-center">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex h-20 w-20 items-center justify-center rounded-full bg-green-500">
          <Video className="h-9 w-9 text-white" />
        </span>
      </span>

      <div className="space-y-2">
        <h2 className="text-3xl font-semibold text-theme">
          لديك جلسة فورية الآن
        </h2>
        {startsAt && (
          <p className="text-sm text-gray-600">تبدأ الجلسة الساعة {startsAt}</p>
        )}
      </div>

      <a
        href={joinUrl}
        className="w-full max-w-sm py-3 rounded-xl bg-green-500 hover:bg-green-600 active:scale-95 transition-all text-white font-semibold text-base"
      >
        انضم للجلسة
      </a>

      <Link href="/dashboard" className="text-sm text-gray-500 underline">
        العودة إلى لوحة التحكم
      </Link>
    </div>
  );
}
