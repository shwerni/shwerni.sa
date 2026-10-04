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
import { ChevronLeft, Star } from "lucide-react";

// props
interface Props {
  consultant: CenterConsultantItem;
  slug: string;
}

// a consultant in a center's grid: slim, one hairline border, a small lift on hover
export function CenterConsultantCard({ consultant, slug }: Props) {
  return (
    <Link
      href={consultantPath(consultant.cid, slug)}
      className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
    >
      <CenterAvatar
        name={consultant.name}
        image={consultant.image}
        gender={consultant.gender}
        size={56}
      />
      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold">{consultant.name}</h3>
        <p className="truncate text-sm text-muted-foreground">{consultant.title}</p>
        <div className="mt-1.5 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-(--center-tint) px-2 py-0.5 font-medium text-(--center-accent-text)">
            {findCategory(consultant.category)?.category ??
              findCategory(consultant.category)?.label}
          </span>
          {consultant.rate > 0 && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {consultant.rate.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <ChevronLeft
        className="size-4 shrink-0 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-(--center-accent-text)"
        strokeWidth={1.75}
      />
    </Link>
  );
}
