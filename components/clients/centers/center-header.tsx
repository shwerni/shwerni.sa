// React & Next
import Image from "next/image";

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

// cover, logo, name and place of a center (theme colors from the shell's css variables)
export function CenterHeader({ center }: Props) {
  const place = [center.city, center.district].filter(Boolean).join("، ");

  return (
    <header className="relative">
      <div
        className="relative h-44 sm:h-64 w-full overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, var(--center-from), var(--center-via), var(--center-to))",
        }}
      >
        {center.cover && (
          <Image
            src={center.cover}
            alt={`غلاف ${center.name}`}
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-80"
          />
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4">
        <div className="-mt-12 flex flex-col items-center gap-3 text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-start">
          <div className="size-24 shrink-0 overflow-hidden rounded-3xl border-4 border-white bg-white shadow-md grid place-items-center sm:size-28">
            {center.logo ? (
              <Image
                src={center.logo}
                alt={`شعار ${center.name}`}
                width={112}
                height={112}
                className="size-full object-cover"
              />
            ) : (
              <span
                className="text-4xl font-bold"
                style={{ color: "var(--center-accent)" }}
              >
                {center.name.slice(0, 1)}
              </span>
            )}
          </div>

          <div className="pb-1">
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {center.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                <MapPin className="size-4" />
                {place}
              </span>
              <span
                className="rounded-full px-3 py-0.5 text-xs font-semibold text-white"
                style={{ background: "var(--center-accent)" }}
              >
                {preferenceLabel[center.preference]}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
