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

// amenities as secondary chips (hidden when there are none)
export function CenterAmenities({ amenities }: Props) {
  if (amenities.length === 0) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2.5">
        <IconSquare icon={Sparkles} size="sm" />
        <h2 className="font-semibold">المرافق</h2>
      </div>
      <ul className="flex flex-wrap gap-2">
        {amenities.map((a) => {
          const Icon = amenityIcon(a);
          return (
            <li
              key={a}
              className="inline-flex items-center gap-1.5 rounded-full bg-(--center-secondary-soft) px-3 py-1 text-sm text-(--center-secondary)"
            >
              <Icon className="size-4" strokeWidth={1.75} />
              {a}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
