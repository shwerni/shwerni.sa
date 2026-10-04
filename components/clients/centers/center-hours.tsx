"use client";
// React & Next
import React from "react";

// components
import { IconSquare } from "@/components/clients/centers/icon-square";
import { WeekdayAr } from "@/components/shared/unavailable-service";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/utils/utils";
import { dateToWeekDay, timeZone } from "@/utils/date";

// icons
import { Clock } from "lucide-react";

// props
interface Props {
  hours: { day: Weekday; open: string; close: string }[];
}

// compact weekly hours; today's row is highlighted after mount (riyadh time), so the cached
// page never pins a day
export function CenterHours({ hours }: Props) {
  const [today, setToday] = React.useState<Weekday | null>(null);
  React.useEffect(() => setToday(dateToWeekDay(timeZone().iso)), []);

  const days = Object.values(Weekday)
    .map((day) => ({ day, shifts: hours.filter((h) => h.day === day) }))
    .filter((d) => d.shifts.length > 0);

  if (days.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-3">
        <IconSquare icon={Clock} />
        <h2 className="font-semibold">ساعات العمل</h2>
      </div>
      <ul className="flex flex-col gap-0.5 text-sm">
        {days.map((d) => {
          const isToday = d.day === today;
          return (
            <li
              key={d.day}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg px-3 py-2",
                isToday && "bg-(--center-soft) text-(--center-accent-text)",
              )}
            >
              <span className={cn("font-medium", isToday && "font-semibold")}>
                {WeekdayAr[d.day]}
                {isToday && <span className="ms-1.5 text-xs">(اليوم)</span>}
              </span>
              <span
                className={cn(!isToday && "text-muted-foreground")}
                dir="ltr"
              >
                {d.shifts.map((s) => `${s.open} – ${s.close}`).join("  ·  ")}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
