// React & Next
import Link from "next/link";

// components
import StarBadge from "@/components/clients/shared/star-badge";
import CurrencyLabel from "@/components/clients/shared/currency-label";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { CategoryBadge } from "@/components/shared/categories-badge";
import { buttonVariants } from "@/components/ui/button";

// types
import type { PublicPackageConsultantItem } from "@/data/packages";

// utils
import { cn } from "@/utils/utils";
import { packageSavings } from "@/utils/packages";

// icons
import { Clock } from "lucide-react";

// one consultant with their matching packages (at most 3, like the booking page)
export function ConsultantPackagesCard({
  item,
}: {
  item: PublicPackageConsultantItem;
}) {
  return (
    <Link
      href={`/consultants/${item.cid}`}
      className="group flex flex-col gap-4 rounded-xl border border-[#E5E7EB] bg-white p-4 transition-colors hover:border-theme-700/40 hover:bg-theme-25 dark:bg-transparent"
    >
      {/* consultant */}
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <ConsultantImage
            name={item.name}
            image={item.image}
            gender={item.gender}
            size="base"
          />
          {item.rate && item.rate > 0 ? (
            <StarBadge
              rate={item.rate}
              className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
              size="xs"
              variant="white"
            />
          ) : null}
        </div>
        <div className="min-w-0 space-y-1.5">
          <h3 className="truncate text-base font-medium text-theme-700">
            {item.name}
          </h3>
          <p className="truncate text-xs text-gray-500">{item.title}</p>
          <div className="flex items-center gap-2">
            <CategoryBadge category={item.category} size="xs" />
            {item.review_count > 0 && (
              <span className="text-xs text-gray-500">
                {item.review_count} تقييمات
              </span>
            )}
          </div>
        </div>
      </div>

      {/* packages */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <Clock className="w-3" />
          <span>جميع جلسات الباقات مدتها 45 دقيقة</span>
        </div>
        {item.packages.slice(0, 3).map((pkg, index) => {
          const savings = packageSavings(item.cost30, pkg.count, pkg.cost);
          return (
            <div
              key={pkg.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-md border border-[#E5E7EB] px-3 py-2",
                index % 2 === 0 ? "bg-theme-25" : "bg-[#F9FAFB]",
                "dark:bg-transparent",
              )}
            >
              <div>
                <p className="text-sm font-bold text-gray-700">
                  {pkg.count} جلسات
                </p>
                {savings.percent > 0 && (
                  <p className="text-xs font-semibold text-gray-500">
                    توفر {savings.percent}%
                  </p>
                )}
              </div>
              <CurrencyLabel
                amount={pkg.cost}
                tax={15}
                className="text-base font-bold text-theme-700"
                size="md"
              />
            </div>
          );
        })}
      </div>

      <span
        className={cn(buttonVariants({ variant: "primary" }), "mt-auto w-full")}
      >
        اختر باقتك
      </span>
    </Link>
  );
}
