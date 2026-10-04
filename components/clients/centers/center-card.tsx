// React & Next
import Link from "next/link";

// components
import { CenterLogo } from "@/components/clients/centers/center-logo";

// prisma data
import type { CenterListItem } from "@/data/center/centers";

// icons
import { ChevronLeft, MapPin, Users } from "lucide-react";

// props
interface Props {
  center: CenterListItem;
}

// a center in the directory: slim, neutral, a small lift on hover
export function CenterCard({ center }: Props) {
  const place = [center.city, center.district].filter(Boolean).join("، ");
  const count = center._count.consultants;

  return (
    <Link
      href={`/centers/${center.slug}`}
      className="group flex items-center gap-4 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <CenterLogo name={center.name} logo={center.logo} size={56} tone="neutral" />
      <div className="min-w-0 flex-1">
        <h2 className="truncate font-semibold">{center.name}</h2>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span className="inline-flex min-w-0 items-center gap-1">
            <MapPin className="size-4 shrink-0" strokeWidth={1.75} />
            <span className="truncate">{place}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="size-4" strokeWidth={1.75} />
            {count > 0 ? `${count} مستشار` : "قريباً"}
          </span>
        </div>
      </div>
      <ChevronLeft
        className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-foreground"
        strokeWidth={1.75}
      />
    </Link>
  );
}
