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

// a consultant in a center's grid: borderless on a light surface, tinted on hover
export function CenterConsultantCard({ consultant, slug }: Props) {
  const category = findCategory(consultant.category);

  return (
    <Link
      href={consultantPath(consultant.cid, slug)}
      className="group flex items-center gap-3 rounded-2xl bg-muted/50 p-3 transition hover:bg-(--center-accent)"
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
        <div className="mt-1 flex items-center gap-2 text-xs">
          <span className="rounded-full bg-(--center-secondary-soft) px-2 py-0.5 font-medium text-(--center-secondary)">
            {category?.category ?? category?.label}
          </span>
          {consultant.rate > 0 && (
            <span className="inline-flex items-center gap-0.5 text-muted-foreground">
              <Star className="size-3.5 fill-amber-400 text-amber-400" />
              {consultant.rate.toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-(--center-primary) sm:inline-flex">
        احجز
        <ChevronLeft
          className="size-4 transition group-hover:-translate-x-0.5"
          strokeWidth={1.75}
        />
      </span>
    </Link>
  );
}
