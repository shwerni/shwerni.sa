"use client";
// React & Next
import React from "react";

// utils
import { timeOptions } from "@/utils";
import { cn } from "@/lib/utils";

// icons
import { Clock, Moon, Sun, Sunrise, Sunset } from "lucide-react";

const TIME_PHASES = [
  {
    key: "late",
    label: "منتصف الليل",
    Icon: Moon,
    style: "text-gray-500",
    range: ["00:00", "04:29"],
  },
  {
    key: "day",
    label: "الصباح",
    Icon: Sunrise,
    style: "text-yellow-500",
    range: ["04:30", "11:59"],
  },
  {
    key: "noon",
    label: "الظهيرة",
    Icon: Sun,
    style: "text-amber-500",
    range: ["12:00", "17:59"],
  },
  {
    key: "night",
    label: "المساء",
    Icon: Sunset,
    style: "text-black",
    range: ["18:00", "23:59"],
  },
] as const;

function timeLabel(value: string): string {
  return timeOptions.find((o) => o.value === value)?.label ?? value;
}

function phaseOf(time: string): (typeof TIME_PHASES)[number]["key"] {
  for (const p of TIME_PHASES) {
    if (time >= p.range[0] && time <= p.range[1]) return p.key;
  }
  return "night";
}

function groupByPhase(times: string[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};
  for (const t of times) {
    const p = phaseOf(t);
    (map[p] ??= []).push(t);
  }
  return map;
}

export default function TimeStep({
  times,
  loading,
  onSelect,
}: {
  times: string[];
  loading: boolean;
  onSelect: (t: string) => void;
}) {
  const grouped = React.useMemo(() => groupByPhase(times), [times]);

  const phaseLabels: Record<string, string> = {
    late: "منتصف الليل",
    day: "الصباح",
    noon: "الظهيرة",
    night: "المساء",
  };

  return (
    <div className="flex-1 overflow-y-auto px-5 py-5">
      {loading ? (
        <div className="flex flex-col gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <div className="h-4 w-24 rounded bg-gray-100 animate-pulse" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className="h-9 w-20 rounded-xl bg-gray-100 animate-pulse"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : times.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
          <Clock className="w-10 h-10 text-red-300" />
          <p className="font-semibold text-gray-700">لا توجد مواعيد متاحة</p>
          <p className="text-sm text-gray-400">
            جميع المواعيد محجوزة لهذا اليوم، اختر يوماً آخر
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {TIME_PHASES.map(({ key, Icon, style }) => {
            const phaseTimes = grouped[key];

            if (!phaseTimes?.length) return null;

            return (
              <div key={key}>
                <div className="flex items-center gap-1.5 mb-3">
                  <Icon className={cn("w-4 h-4", style)} />
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {phaseLabels[key]}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {phaseTimes.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => onSelect(t)}
                      className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:border-[#094577]/50 hover:text-[#094577] active:scale-95 transition-all duration-150"
                    >
                      {timeLabel(t)}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
