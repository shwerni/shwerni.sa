// components
import { WeekdayAr } from "@/components/shared/unavailable-service";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// icons
import { CalendarDays, Users, type LucideIcon } from "lucide-react";

// props
interface Props {
  workDays: Weekday[];
  consultants: number;
}

// "الأحد – الخميس" for a contiguous run of days, otherwise the days listed
export const workDaysLabel = (days: Weekday[]) => {
  const order = Object.values(Weekday);
  const idx = [...new Set(days)].map((d) => order.indexOf(d)).sort((a, b) => a - b);
  if (idx.length === 0) return "";
  if (idx.length === 7) return "كل أيام الأسبوع";
  const contiguous = idx.every((v, i) => v === idx[0] + i);
  if (contiguous && idx.length > 2)
    return `${WeekdayAr[order[idx[0]]]} – ${WeekdayAr[order[idx[idx.length - 1]]]}`;
  return idx.map((i) => WeekdayAr[order[i]]).join("، ");
};

// quick facts as light inline chips (no boxes)
export function CenterQuickInfo({ workDays, consultants }: Props) {
  const days = workDaysLabel(workDays);
  const items: { text: string; icon: LucideIcon }[] = [
    ...(days ? [{ text: days, icon: CalendarDays }] : []),
    ...(consultants > 0 ? [{ text: `${consultants} مستشار`, icon: Users }] : []),
  ];

  if (items.length === 0) return null;

  return (
    <ul className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
      {items.map((it) => (
        <li key={it.text} className="inline-flex items-center gap-1.5">
          <it.icon className="size-4 text-(--center-secondary)" strokeWidth={1.75} />
          {it.text}
        </li>
      ))}
    </ul>
  );
}
