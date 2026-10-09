// React & Next
import Link from "next/link";

// components
import { Button } from "@/components/ui/button";
import SvgIcon from "@/components/shared/svg-icon";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import ConsultantSpecialties from "@/components/clients/shared/consultant-specialties";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

// utils
import { cn } from "@/utils/utils";

// types
import { ConsultantCard } from "@/types/layout";

// a LAW consultant on the pleading page: the same card body as the home list, with two actions,
// a normal booking or a pleading request
export function PleadingConsultantCard({
  consultant,
}: {
  consultant: ConsultantCard;
}) {
  return (
    <Card className="gap-3 w-full h-full py-4 border-none">
      <CardContent className="flex items-start gap-3 px-4">
        {/* image and rate */}
        <div className="flex flex-col items-center justify-start gap-3">
          <ConsultantImage
            name={consultant.name}
            image={consultant.image}
            gender={consultant.gender}
            size="sm"
          />
          <div
            className={cn("h-5", {
              invisible: !consultant.rate || Number(consultant.rate) <= 0,
            })}
          >
            <StarBadge rate={consultant.rate} size="xs" />
          </div>
        </div>

        {/* name and info */}
        <div className="flex flex-col gap-3 mt-2 min-w-0">
          <div className="space-y-1.5">
            <h3 className="text-theme-700 font-semibold mr-1 truncate">
              {consultant.name}
            </h3>
            {consultant.title && (
              <p className="text-xs text-slate-500 mr-1 line-clamp-1">
                {consultant.title}
              </p>
            )}
            <CategoryBadge category={consultant.category} size="xs" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <SvgIcon
                src="/svg/icons/consultant-card-medal.svg"
                className="w-3.5 text-slate-400"
              />
              <span className="text-slate-400 text-xs">
                خبرة {consultant.years} سنوات
              </span>
            </div>
            <div
              className={cn("flex items-center gap-1.5", {
                invisible:
                  !consultant.reviews || Number(consultant.reviews) <= 0,
              })}
            >
              <SvgIcon
                src="/svg/icons/consultant-card-star.svg"
                className="w-3.5 text-slate-400"
              />
              <span className="text-slate-400 text-xs">
                {Number(consultant.reviews)} تقييمات
              </span>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="mt-auto flex flex-col items-stretch gap-3 px-4">
        <ConsultantSpecialties specialties={consultant.specialties} />
        <div className="grid grid-cols-2 gap-2">
          <Button asChild variant="outline" className="text-theme-700">
            <Link href={`/consultants/${consultant.cid}`}>احجز جلسة</Link>
          </Button>
          <Button asChild className="bg-theme hover:bg-theme/90 text-white">
            <Link href={`/pleading/request/${consultant.cid}`}>
              اطلب مرافعة
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
