// React & Next
import Link from "next/link";
import Image from "next/image";

// prisma data
import type { CenterListItem } from "@/data/center/centers";

// icons
import { MapPin, Users } from "lucide-react";

// props
interface Props {
  center: CenterListItem;
}

// a center on /centers
export function CenterCard({ center }: Props) {
  const place = [center.city, center.district].filter(Boolean).join("، ");
  const count = center._count.consultants;

  return (
    <Link
      href={`/centers/${center.slug}`}
      className="group flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div className="flex items-center gap-3">
        <div className="size-16 shrink-0 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 grid place-items-center">
          {center.logo ? (
            <Image
              src={center.logo}
              alt={`شعار ${center.name}`}
              width={64}
              height={64}
              className="size-16 object-cover"
            />
          ) : (
            <span className="text-2xl font-bold text-slate-400">
              {center.name.slice(0, 1)}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold text-slate-900">
            {center.name}
          </h2>
          <p className="mt-0.5 inline-flex items-center gap-1 text-sm text-slate-500">
            <MapPin className="size-4 shrink-0" />
            <span className="truncate">{place}</span>
          </p>
        </div>
      </div>

      {center.description && (
        <p className="line-clamp-2 text-sm leading-6 text-slate-600">
          {center.description}
        </p>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-3 text-sm">
        <span className="inline-flex items-center gap-1.5 text-slate-600">
          <Users className="size-4" />
          {count > 0 ? `${count} مستشار` : "لا يوجد مستشارون بعد"}
        </span>
        <span className="font-semibold text-slate-900 group-hover:underline">
          زيارة المركز
        </span>
      </div>
    </Link>
  );
}
