// React & Next
import Image from "next/image";

// components
import { CenterLogo } from "@/components/clients/centers/center-logo";

// prisma data
import type { PublicCenter } from "@/data/center/centers";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// icons
import { MapPin } from "lucide-react";

// labels
export const preferenceLabel: Record<GenderPreference, string> = {
  [GenderPreference.MEN_ONLY]: "للرجال فقط",
  [GenderPreference.WOMEN_ONLY]: "للنساء فقط",
  [GenderPreference.BOTH]: "للجميع",
};

// props
interface Props {
  center: PublicCenter;
}

// cover (or a soft accent gradient), logo, name, city, short description and gender badge
export function CenterHero({ center }: Props) {
  const place = [center.city, center.district].filter(Boolean).join("، ");

  return (
    <section>
      <div
        className="relative h-40 overflow-hidden rounded-3xl sm:h-56"
        style={{
          background:
            "linear-gradient(135deg, var(--center-soft) 0%, var(--center-tint) 100%)",
        }}
      >
        {center.cover && (
          <Image
            src={center.cover}
            alt={`غلاف ${center.name}`}
            fill
            priority
            sizes="(min-width: 1152px) 1152px, 100vw"
            className="object-cover"
          />
        )}
      </div>

      <div className="px-1 sm:px-5">
        <CenterLogo
          name={center.name}
          logo={center.logo}
          size={88}
          className="-mt-11 border-4 border-background shadow-sm sm:-mt-12"
        />

        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {center.name}
            </h1>
            <span className="rounded-full bg-(--center-tint) px-2.5 py-0.5 text-xs font-medium text-(--center-accent-text)">
              {preferenceLabel[center.preference]}
            </span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
            <MapPin className="size-4" strokeWidth={1.75} />
            {place}
          </p>
          {center.description && (
            <p className="line-clamp-2 max-w-2xl leading-7 text-muted-foreground">
              {center.description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
