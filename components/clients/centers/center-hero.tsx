// React & Next
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

// components
import { CenterLogo } from "@/components/clients/centers/center-logo";

// prisma data
import type { PublicCenter } from "@/data/center/centers";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/utils/utils";

// icons
import { CalendarCheck, MapPin, Navigation } from "lucide-react";

// labels
export const preferenceLabel: Record<GenderPreference, string> = {
  [GenderPreference.MEN_ONLY]: "للرجال فقط",
  [GenderPreference.WOMEN_ONLY]: "للنساء فقط",
  [GenderPreference.BOTH]: "للجميع",
};

// props
interface Props {
  center: PublicCenter;
  // inline quick facts (streamed by the page)
  chips?: ReactNode;
}

// the hero: who the center is and how to book. with a cover, the logo sits on top of it;
// without one, a compact hero on a faint wash (no empty box)
export function CenterHero({ center, chips }: Props) {
  const place = [center.city, center.district].filter(Boolean).join("، ");
  const hasCover = !!center.cover;

  return (
    <section>
      {hasCover && (
        <div className="relative h-40 overflow-hidden rounded-3xl sm:h-56">
          <Image
            src={center.cover!}
            alt={`غلاف ${center.name}`}
            fill
            priority
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
          />
        </div>
      )}

      <div
        className={cn(
          "flex flex-col gap-5 sm:flex-row sm:items-end",
          hasCover
            ? "px-1 sm:px-5"
            : "rounded-3xl bg-(--center-accent) px-5 py-6 sm:px-8 sm:py-8",
        )}
      >
        {/* relative + z-10: above the positioned cover image, never clipped behind it */}
        <CenterLogo
          name={center.name}
          logo={center.logo}
          size={hasCover ? 96 : 80}
          className={cn(
            "relative z-10",
            hasCover && "-mt-12 border-4 border-background shadow-sm",
          )}
        />

        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {center.name}
            </h1>
            <span className="rounded-full bg-(--center-secondary-soft) px-2.5 py-0.5 text-xs font-medium text-(--center-secondary)">
              {preferenceLabel[center.preference]}
            </span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" strokeWidth={1.75} />
            {place}
          </p>
          {center.description && (
            <p className="line-clamp-1 max-w-2xl text-muted-foreground">
              {center.description}
            </p>
          )}
          {chips}
        </div>

        <div className="flex shrink-0 gap-2">
          <Link
            href="#consultants"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-(--center-primary) px-5 text-sm font-semibold text-(--center-primary-foreground) transition hover:opacity-90 sm:flex-none"
          >
            <CalendarCheck className="size-4" strokeWidth={1.75} />
            احجز موعد
          </Link>
          <Link
            href="#location"
            className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-background/80 px-4 text-sm font-medium ring-1 ring-border transition hover:bg-background sm:flex-none"
          >
            <Navigation className="size-4" strokeWidth={1.75} />
            الموقع
          </Link>
        </div>
      </div>
    </section>
  );
}
