// components
import { IconSquare } from "@/components/clients/centers/icon-square";
import { WeekdayAr } from "@/components/shared/unavailable-service";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// icons
import { CalendarDays, MapPin, Users, type LucideIcon } from "lucide-react";

// props
interface Props {
  city: string;
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

// quick facts as small stat tiles
export function CenterQuickInfo({ city, workDays, consultants }: Props) {
  const days = workDaysLabel(workDays);
  const items: { label: string; value: string; icon: LucideIcon }[] = [
    { label: "المدينة", value: city, icon: MapPin },
    ...(days ? [{ label: "أيام العمل", value: days, icon: CalendarDays }] : []),
    {
      label: "المستشارون",
      value: consultants > 0 ? String(consultants) : "قريباً",
      icon: Users,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card p-4 last:col-span-2 sm:last:col-span-1"
        >
          <div className="min-w-0">
            <p className="truncate font-semibold">{it.value}</p>
            <p className="text-xs text-muted-foreground">{it.label}</p>
          </div>
          <IconSquare icon={it.icon} />
        </div>
      ))}
    </div>
  );
}
