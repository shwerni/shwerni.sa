// React & Next
import Link from "next/link";

// components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// types
import { ConsultantCard } from "@/types/layout";

// a LAW consultant on the pleading page: a compact horizontal card (photo beside the name and
// badges) with two actions in one row, a normal booking or a pleading request
export function PleadingConsultantCard({
  consultant,
}: {
  consultant: ConsultantCard;
}) {
  const rated = !!consultant.rate && Number(consultant.rate) > 0;

  return (
    <Card className="gap-3 w-full p-3 border-none">
      {/* photo, name and badges */}
      <div className="flex items-center gap-3 min-w-0">
        <ConsultantImage
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size="sm"
          className="w-12 h-12"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-theme-700 font-semibold text-sm truncate">
              {consultant.name}
            </h3>
            {rated && <StarBadge rate={consultant.rate} size="xs" />}
          </div>
          {consultant.title && (
            <p className="text-xs text-slate-500 truncate">{consultant.title}</p>
          )}
          <div className="flex items-center gap-2">
            <CategoryBadge category={consultant.category} size="xs" />
            <span className="text-[11px] text-slate-400 whitespace-nowrap">
              خبرة {consultant.years} سنوات
            </span>
          </div>
        </div>
      </div>

      {/* actions */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="w-full h-8 text-xs text-theme-700"
        >
          <Link href={`/consultants/${consultant.cid}`}>احجز جلسة</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="w-full h-8 text-xs bg-theme hover:bg-theme/90 text-white"
        >
          <Link href={`/pleading/request/${consultant.cid}`}>اطلب مرافعة</Link>
        </Button>
      </div>
    </Card>
  );
}
