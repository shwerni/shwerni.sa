// components
import { IconSquare } from "@/components/clients/centers/icon-square";

// icons
import {
  Accessibility,
  Car,
  Check,
  Coffee,
  Sofa,
  Sparkles,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";

// props
interface Props {
  amenities: string[];
}

// an icon for a free-text amenity, by keyword
const amenityIcon = (a: string): LucideIcon => {
  if (/مواقف|موقف|سيار/.test(a)) return Car;
  if (/نسائي|نساء|سيدات/.test(a)) return Users;
  if (/إعاقة|اعاقة|ذوي|كرسي/.test(a)) return Accessibility;
  if (/واي|إنترنت|انترنت|wifi/i.test(a)) return Wifi;
  if (/انتظار|استراحة/.test(a)) return Sofa;
  if (/قهوة|ضيافة|مشروب/.test(a)) return Coffee;
  return Check;
};

// amenities as icon chips (hidden when there are none)
export function CenterAmenities({ amenities }: Props) {
  if (amenities.length === 0) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-3">
        <IconSquare icon={Sparkles} />
        <h2 className="font-semibold">المرافق</h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {amenities.map((a) => {
          const Icon = amenityIcon(a);
          return (
            <li
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1.5 text-sm"
            >
              <Icon className="size-4 text-(--center-accent-text)" strokeWidth={1.75} />
              {a}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
