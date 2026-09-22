"use client";

// React & Next
import { useEffect, useState } from "react";

// components
import EventFlipDigit from "./clock";

// constants
import { EVENT_DATE } from "./constant";

// event window — Riyadh time (+03:00)
const EVENT_START = new Date(`${EVENT_DATE}T00:00:00+03:00`).getTime();
const EVENT_END = new Date(`${EVENT_DATE}T23:59:59+03:00`).getTime();

type Phase = "upcoming" | "live" | "ended";

type Remaining = {
  phase: Phase;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const getRemaining = (): Remaining => {
  const now = Date.now();

  const phase: Phase =
    now < EVENT_START ? "upcoming" : now <= EVENT_END ? "live" : "ended";

  const target = phase === "upcoming" ? EVENT_START : EVENT_END;
  const diff = phase === "ended" ? 0 : Math.max(0, target - now);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    phase,
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
};

const pad = (n: number) => n.toString().padStart(2, "0");

// ---------- icons ----------
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
    <path
      d="M7 3v3M17 3v3M4 8h16M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 sm:w-5 sm:h-5">
    <path
      d="M5 12.5 10 17l9-10"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LiveDot = () => (
  <span className="relative flex w-2.5 h-2.5">
    <span className="absolute inline-flex w-full h-full rounded-full bg-white opacity-75 animate-ping" />
    <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-white" />
  </span>
);

// ---------- header ----------
const HEADER: Record<
  Phase,
  { badge: string; title: string; className: string }
> = {
  upcoming: {
    badge: "قريبًا",
    title: "يبدأ العرض بعد",
    className: "bg-theme-50 text-theme-900 ring-1 ring-theme/30",
  },
  live: {
    badge: "العرض متاح الآن",
    title: "ينتهي العرض بعد",
    className: "bg-gradient-to-l from-theme to-theme-700 text-white shadow-md",
  },
  ended: {
    badge: "انتهى العرض",
    title: "شكرًا لمشاركتكم احتفالات اليوم الوطني",
    className: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
  },
};

const Header = ({ phase }: { phase: Phase }) => {
  const { badge, title, className } = HEADER[phase];

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs sm:text-sm font-semibold ${className}`}
      >
        {phase === "upcoming" && <CalendarIcon />}
        {phase === "live" && <LiveDot />}
        {phase === "ended" && <CheckIcon />}
        {badge}
      </span>
      <p className="text-theme-900 font-bold text-base sm:text-lg">{title}</p>
    </div>
  );
};

// ---------- clock ----------
const Unit = ({ value, label }: { value: string; label: string }) => {
  const [d1, d2] = value.split("");

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex items-center gap-1">
        <EventFlipDigit value={d1} />
        <EventFlipDigit value={d2} />
      </div>
      <span className="text-xs sm:text-sm text-theme-700 font-medium">
        {label}
      </span>
    </div>
  );
};

const Separator = () => (
  <span className="text-theme-700 font-bold text-xl sm:text-2xl self-start mt-3 sm:mt-6">
    :
  </span>
);

// ---------- main ----------
const EventCountdown = () => {
  // null until mount — avoids server/client hydration mismatch
  const [time, setTime] = useState<Remaining | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTime(getRemaining());
    const interval = setInterval(() => setTime(getRemaining()), 1000);
    return () => clearInterval(interval);
  }, []);

  const phase: Phase = time?.phase ?? "upcoming";

  if (phase === "ended") {
    return (
      <div dir="rtl" className="flex flex-col items-center">
        <Header phase="ended" />
      </div>
    );
  }

  const show = (n: number | undefined) => (n === undefined ? "--" : pad(n));

  return (
    <div dir="rtl" className="flex flex-col items-center gap-4">
      <Header phase={phase} />

      {/* clock reads left-to-right: (days) hours : minutes : seconds */}
      <div dir="ltr" className="flex items-start gap-2 sm:gap-4">
        {time && time.days > 0 && (
          <>
            <Unit value={pad(time.days)} label="يوم" />
            <Separator />
          </>
        )}
        <Unit value={show(time?.hours)} label="ساعة" />
        <Separator />
        <Unit value={show(time?.minutes)} label="دقيقة" />
        <Separator />
        <Unit value={show(time?.seconds)} label="ثانية" />
      </div>
    </div>
  );
};

export default EventCountdown;
