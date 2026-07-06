"use client";

// React & Next
import React from "react";
import Link from "next/link";

// packages
import { addDays, format, isSameDay, isAfter, isBefore, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { cn } from "@/lib/utils";
import { add25Minutes, getDatesAhead } from "@/utils/date";
import { dateToString } from "@/utils/time";
import { timeOptions } from "@/utils";

// actions

// icons
import { Briefcase, CalendarDays, Clock, MessageCircle, ChevronLeft } from "lucide-react";
import { getAvailableTimesForDate, getConsultantsAvailableAt, ReelConsultant } from "./actions";

// ─── Category labels ──────────────────────────────────────────────────────────

const categoryLabels: Record<string, string> = {
  PSYCHOLOGY: "علم النفس",
  NUTRITION: "تغذية",
  LEGAL: "قانوني",
  FINANCE: "مالي",
  HEALTH: "صحة",
  FAMILY: "أسرة",
  CAREER: "مهني",
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  const parts = name.trim().split(" ");
  return parts.length === 1
    ? parts[0].slice(0, 2)
    : (parts[0][0] ?? "") + (parts[1][0] ?? "");
}

function timeLabel(value: string): string {
  return timeOptions.find((o) => o.value === value)?.label ?? value;
}

// ─── Day pill ─────────────────────────────────────────────────────────────────

function DayPill({
  dateStr,
  selected,
  disabled,
  onClick,
}: {
  dateStr: string;
  selected: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  const d = new Date(dateStr);
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl px-3 py-2 min-w-[52px] shrink-0",
        "border transition-all duration-200 select-none",
        selected
          ? "bg-[#094577] text-white border-[#094577] shadow-sm"
          : "bg-white text-gray-700 border-gray-200 hover:border-[#094577]/40",
        disabled && "opacity-30 pointer-events-none",
      )}
    >
      <span className="text-[11px] font-medium">
        {format(d, "EEE", { locale: ar })}
      </span>
      <span className="text-[17px] font-bold leading-tight">{format(d, "d")}</span>
    </button>
  );
}

// ─── Time pill ────────────────────────────────────────────────────────────────

function TimePill({
  value,
  selected,
  onClick,
}: {
  value: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-1.5 rounded-full text-sm font-medium border shrink-0",
        "transition-all duration-200 whitespace-nowrap",
        selected
          ? "bg-[#094577] text-white border-[#094577]"
          : "bg-white text-gray-700 border-gray-200 hover:border-[#094577]/40",
      )}
    >
      {timeLabel(value)}
    </button>
  );
}

// ─── Skeleton loaders ─────────────────────────────────────────────────────────

function TimeSkeleton() {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-8 w-20 rounded-full bg-gray-100 animate-pulse shrink-0" />
      ))}
    </div>
  );
}

// ─── Empty / info states ──────────────────────────────────────────────────────

function EmptyState({
  icon: Icon,
  title,
  sub,
  danger,
}: {
  icon: React.ElementType;
  title: string;
  sub: string;
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8 text-center">
      <div
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center",
          danger ? "bg-red-50" : "bg-[#094577]/8",
        )}
      >
        <Icon
          className={cn(
            "w-8 h-8",
            danger ? "text-red-300" : "text-[#094577]/40",
          )}
        />
      </div>
      <div>
        <p className={cn("font-semibold text-lg", danger ? "text-gray-700" : "text-[#094577]")}>
          {title}
        </p>
        <p className="text-gray-400 text-sm mt-1 leading-relaxed">{sub}</p>
      </div>
    </div>
  );
}

// ─── Consultant reel card ─────────────────────────────────────────────────────

function ConsultantCard({
  consultant,
  isActive,
  selectedDate,
  selectedTime,
}: {
  consultant: ReelConsultant;
  isActive: boolean;
  selectedDate: Date;
  selectedTime: string;
}) {
  const initials = getInitials(consultant.name);

  const params = new URLSearchParams({
    date: dateToString(selectedDate),
    time: selectedTime,
  });
  const href = `/consultants/${consultant.cid}?${params.toString()}`;

  return (
    <div
      className="relative w-full h-full flex flex-col items-center justify-end"
      style={{ scrollSnapAlign: "start", flexShrink: 0 }}
    >
      {/* bg */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(155deg, #e8f1fb 0%, #f3f7fd 45%, #ffffff 100%)",
        }}
      />

      {/* glow circle */}
      <div
        className="absolute"
        style={{
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 220,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(9,69,119,0.09) 0%, transparent 70%)",
        }}
      />

      {/* avatar */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2",
          "w-[110px] h-[110px] rounded-full flex items-center justify-center",
          "text-[38px] font-bold text-[#094577] border-4 border-white shadow-lg",
          "transition-transform duration-500",
          isActive ? "scale-100" : "scale-95 opacity-80",
        )}
        style={{ top: 44, background: "#ddeaf5" }}
      >
        {initials}
      </div>

      {/* star badge */}
      {consultant.rate > 0 && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white shadow-sm text-[11px] font-semibold text-amber-600 border border-amber-100"
          style={{ top: 168 }}
        >
          <span className="text-amber-400">★</span>
          {consultant.rate.toFixed(1)}
        </div>
      )}

      {/* content panel */}
      <div
        className={cn(
          "relative w-full bg-white rounded-t-[28px] shadow-[0_-6px_30px_rgba(9,69,119,0.08)]",
          "flex flex-col gap-4 px-5 pt-6 pb-8",
          "transition-transform duration-500",
          isActive ? "translate-y-0" : "translate-y-2",
        )}
        style={{ maxHeight: "60vh", overflowY: "auto" }}
      >
        {/* name / title / category */}
        <div className="text-center">
          <h2 className="text-xl font-bold text-[#094577]">{consultant.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{consultant.title}</p>
          <span className="mt-2 inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-[#094577]/10 text-[#094577]">
            {categoryLabels[consultant.category] ?? consultant.category}
          </span>
        </div>

        {/* stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-[#094577]/50" />
            <span>
              {consultant.years} {consultant.years === 1 ? "سنة" : "سنوات"}
            </span>
          </div>
          {consultant.review_count > 0 && (
            <div className="flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#094577]/50" />
              <span>{consultant.review_count} تقييم</span>
            </div>
          )}
        </div>

        {/* bio */}
        {consultant.nabout && (
          <p className="text-sm text-gray-600 leading-relaxed text-right line-clamp-4">
            {consultant.nabout}
          </p>
        )}

        {/* cost chips */}
        <div className="flex flex-wrap gap-2 justify-center">
          {(
            [
              { label: "٣٠ د", value: consultant.cost30 },
              { label: "٤٥ د", value: consultant.cost45 },
              { label: "٦٠ د", value: consultant.cost60 },
            ] as const
          ).map(({ label, value }) =>
            value > 0 ? (
              <div
                key={label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 bg-gray-50 text-xs text-gray-700"
              >
                <Clock className="w-3 h-3 text-[#094577]/40" />
                <span>{label}</span>
                <span className="font-bold text-[#094577]">{value} ر.س</span>
              </div>
            ) : null,
          )}
        </div>

        {/* CTA */}
        <Link
          href={href}
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#094577] text-white text-sm font-semibold hover:bg-[#0a5291] active:scale-[0.98] transition-all duration-150"
        >
          <ChevronLeft className="w-4 h-4" />
          احجز الآن – {timeLabel(selectedTime)}
        </Link>
      </div>
    </div>
  );
}

// ─── Dot rail ─────────────────────────────────────────────────────────────────

function DotRail({
  count,
  active,
  scrollRef,
}: {
  count: number;
  active: number;
  scrollRef: React.RefObject<HTMLDivElement>;
}) {
  function scrollTo(i: number) {
    scrollRef.current?.scrollTo({
      top: i * (scrollRef.current.clientHeight ?? 0),
      behavior: "smooth",
    });
  }

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          onClick={() => scrollTo(i)}
          className={cn(
            "w-[7px] rounded-full cursor-pointer transition-all duration-200",
            active === i
              ? "h-6 bg-[#094577]"
              : "h-[7px] bg-[#094577]/20 hover:bg-[#094577]/40",
          )}
        />
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConsultantReelPage() {
  // time setup
  const { iso: initial } = timeZone();
  const { date: iso, time: nowTime } = React.useMemo(
    () => add25Minutes(initial),
    [initial],
  );

  const days = getDatesAhead(7, initial);

  // state
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [flatTimes, setFlatTimes] = React.useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = React.useState(false);
  const [consultants, setConsultants] = React.useState<ReelConsultant[]>([]);
  const [loadingConsultants, setLoadingConsultants] = React.useState(false);
  const [activeIdx, setActiveIdx] = React.useState(0);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  // track visible card
  React.useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollTop / el.clientHeight);
      setActiveIdx(idx);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [consultants]);

  // ── handlers ──────────────────────────────────────────────────────────────

  async function handleDateSelect(dateStr: string) {
    const date = new Date(dateStr);
    setSelectedDate(date);
    setSelectedTime(null);
    setFlatTimes([]);
    setConsultants([]);
    setActiveIdx(0);
    setLoadingTimes(true);

    try {
      const minTime = isSameDay(date, iso) ? nowTime : undefined;
      const times = await getAvailableTimesForDate(dateStr, minTime);
      setFlatTimes(times);
    } finally {
      setLoadingTimes(false);
    }
  }

  async function handleTimeSelect(time: string) {
    if (!selectedDate) return;
    setSelectedTime(time);
    setConsultants([]);
    setActiveIdx(0);
    setLoadingConsultants(true);

    try {
      const data = await getConsultantsAvailableAt(
        dateToString(selectedDate),
        time,
      );
      setConsultants(data);
    } finally {
      setLoadingConsultants(false);
    }
  }

  // ── render ────────────────────────────────────────────────────────────────

  const showConsultants = !loadingConsultants && consultants.length > 0;

  return (
    <div dir="rtl" className="flex flex-col h-screen overflow-hidden bg-gray-50">
      {/* ── sticky header ─────────────────────────────────────────────────── */}
      <div className="shrink-0 bg-white border-b border-gray-100 shadow-sm z-20 px-4 pt-4">
        {/* day selector */}
        <p className="text-[11px] text-gray-400 font-medium mb-2 px-0.5">
          اختر التاريخ
        </p>
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
          {days.map((d) => {
            const dateObj = new Date(d);
            const disabled =
              isBefore(dateObj, startOfDay(iso)) ||
              isAfter(dateObj, addDays(iso, 10)) ||
              /* add unavailable weekdays check here if needed */
              false;
            return (
              <DayPill
                key={d}
                dateStr={d}
                selected={selectedDate ? dateToString(selectedDate) === d : false}
                disabled={disabled}
                onClick={() => handleDateSelect(d)}
              />
            );
          })}
        </div>

        {/* time selector — slides in after day picked */}
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: selectedDate ? 96 : 0,
            opacity: selectedDate ? 1 : 0,
          }}
        >
          <p className="text-[11px] text-gray-400 font-medium mb-2 px-0.5">
            اختر الوقت
          </p>
          {loadingTimes ? (
            <TimeSkeleton />
          ) : flatTimes.length === 0 ? (
            <p className="text-xs text-red-500 pb-3">
              لا توجد مواعيد متاحة لهذا اليوم
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {flatTimes.map((t) => (
                <TimePill
                  key={t}
                  value={t}
                  selected={selectedTime === t}
                  onClick={() => handleTimeSelect(t)}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── reel area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden relative">
        {/* no date */}
        {!selectedDate && (
          <EmptyState
            icon={CalendarDays}
            title="اختر تاريخاً للبدء"
            sub="حدد يوماً من الشريط أعلاه ثم اختر الوقت المناسب لرؤية المستشارين المتاحين"
          />
        )}

        {/* date picked, waiting for time */}
        {selectedDate && !selectedTime && !loadingTimes && flatTimes.length > 0 && (
          <EmptyState
            icon={Clock}
            title="اختر الوقت"
            sub="حدد الوقت المناسب لك من الشريط أعلاه"
          />
        )}

        {/* loading consultants */}
        {loadingConsultants && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-11 h-11 rounded-full border-4 border-[#094577]/15 border-t-[#094577] animate-spin" />
            <p className="text-sm text-gray-400">جاري البحث عن مستشارين…</p>
          </div>
        )}

        {/* no consultants for this slot */}
        {selectedTime && !loadingConsultants && consultants.length === 0 && (
          <EmptyState
            icon={MessageCircle}
            title="لا يوجد مستشارون متاحون"
            sub="جميع المستشارين محجوزون في هذا الوقت، حاول اختيار وقت آخر"
            danger
          />
        )}

        {/* consultant cards */}
        {showConsultants && (
          <>
            {/* dot rail */}
            <DotRail
              count={consultants.length}
              active={activeIdx}
              scrollRef={scrollRef as React.RefObject<HTMLDivElement>}
            />

            {/* counter badge */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-gray-100 text-xs font-medium text-gray-500 z-10 pointer-events-none">
              {activeIdx + 1} / {consultants.length}
            </div>

            {/* snap scroll container */}
            <div
              ref={scrollRef}
              className="h-full overflow-y-scroll scrollbar-hide"
              style={{ scrollSnapType: "y mandatory", scrollBehavior: "smooth" }}
            >
              {consultants.map((c, i) => (
                <div key={c.cid} style={{ height: "100%", scrollSnapAlign: "start" }}>
                  <ConsultantCard
                    consultant={c}
                    isActive={activeIdx === i}
                    selectedDate={selectedDate!}
                    selectedTime={selectedTime!}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}