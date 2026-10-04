// components
import { WeekdayAr } from "@/components/shared/unavailable-service";

// prisma data
import type { PublicCenter } from "@/data/center/centers";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// icons
import { Clock, ExternalLink, MapPin, Sparkles } from "lucide-react";

// props
interface Props {
  center: PublicCenter;
}

// a google maps link from the center's coordinates
const mapsLink = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat},${lng}`;

// about, location, work hours and amenities of a center
export function CenterInfo({ center }: Props) {
  // work hours grouped by day, in weekday order (split shifts allowed)
  const days = Object.values(Weekday)
    .map((day) => ({
      day,
      shifts: center.workHours.filter((h) => h.day === day),
    }))
    .filter((d) => d.shifts.length > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* about */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 lg:col-span-2">
        <h2 className="text-lg font-bold text-slate-900">عن المركز</h2>
        <p className="mt-3 whitespace-pre-line leading-7 text-slate-700">
          {center.description || "لا يوجد وصف بعد."}
        </p>

        {center.amenities.length > 0 && (
          <div className="mt-5">
            <h3 className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-900">
              <Sparkles className="size-4" />
              المرافق
            </h3>
            <ul className="mt-2 flex flex-wrap gap-2">
              {center.amenities.map((a) => (
                <li
                  key={a}
                  className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
                >
                  {a}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* location + hours */}
      <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6">
        <div>
          <h2 className="inline-flex items-center gap-1.5 text-lg font-bold text-slate-900">
            <MapPin className="size-5" />
            الموقع
          </h2>
          <p className="mt-2 leading-7 text-slate-700">{center.address}</p>
          <a
            href={mapsLink(center.lat, center.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline-offset-4 hover:underline"
            style={{ color: "var(--center-accent)" }}
          >
            فتح الموقع في خرائط جوجل
            <ExternalLink className="size-4" />
          </a>
        </div>

        <div>
          <h2 className="inline-flex items-center gap-1.5 text-lg font-bold text-slate-900">
            <Clock className="size-5" />
            ساعات العمل
          </h2>
          {days.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">لم تُحدد بعد.</p>
          ) : (
            <ul className="mt-2 divide-y divide-slate-100 text-sm">
              {days.map((d) => (
                <li key={d.day} className="flex justify-between gap-3 py-1.5">
                  <span className="font-medium text-slate-800">
                    {WeekdayAr[d.day]}
                  </span>
                  <span className="text-slate-600" dir="ltr">
                    {d.shifts.map((s) => `${s.open} - ${s.close}`).join("  ·  ")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
