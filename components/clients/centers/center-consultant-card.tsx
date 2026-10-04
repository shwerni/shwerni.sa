// React & Next
import Link from "next/link";

// components
import { CenterAvatar } from "@/components/clients/centers/center-avatar";

// prisma data
import type { CenterConsultantItem } from "@/data/center/consultants";

// utils
import { findCategory } from "@/utils";
import { consultantPath } from "@/utils/consultant-path";

// icons
import { Star } from "lucide-react";

// props
interface Props {
  consultant: CenterConsultantItem;
  slug: string;
}

// a consultant in a center's grid
export function CenterConsultantCard({ consultant, slug }: Props) {
  return (
    <Link
      href={consultantPath(consultant.cid, slug)}
      className="group flex items-center gap-4 rounded-3xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      <CenterAvatar
        name={consultant.name}
        image={consultant.image}
        gender={consultant.gender}
        size={72}
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-bold text-slate-900">{consultant.name}</h3>
        <p className="truncate text-sm text-slate-600">{consultant.title}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-700">
            {findCategory(consultant.category)?.label}
          </span>
          {consultant.rate > 0 && (
            <span className="inline-flex items-center gap-0.5 text-amber-600">
              <Star className="size-3.5 fill-current" />
              {consultant.rate.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <span
        className="shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold text-white transition group-hover:opacity-90"
        style={{ background: "var(--center-accent)" }}
      >
        احجز
      </span>
    </Link>
  );
}
