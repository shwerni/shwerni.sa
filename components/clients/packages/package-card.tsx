// React & Next
import Link from "next/link";

// components
import StarBadge from "@/components/clients/shared/star-badge";
import CurrencyLabel from "@/components/clients/shared/currency-label";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { CategoryBadge } from "@/components/shared/categories-badge";
import { buttonVariants } from "@/components/ui/button";

// types
import type { PublicPackageItem } from "@/data/packages";

// utils
import { cn } from "@/utils/utils";
import { packageSavings } from "@/utils/packages";

// icons
import { Clock } from "lucide-react";

// one package with its consultant; booking happens on the consultant's page
export function PackageCard({ item }: { item: PublicPackageItem }) {
  const savings = packageSavings(item.cost30, item.count, item.cost);

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
            size="sm"
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
        <div className="min-w-0 space-y-1">
          <h3 className="truncate text-base font-medium text-theme-700">
            {item.name}
          </h3>
          <p className="truncate text-xs text-gray-500">{item.title}</p>
        </div>
      </div>

      <CategoryBadge category={item.category} size="xs" className="w-fit" />

      {/* package */}
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="text-lg font-bold text-gray-700">{item.count} جلسات</p>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <Clock className="w-3" />
            <span>45 دقيقة للجلسة</span>
          </div>
        </div>
        <CurrencyLabel
          amount={item.cost}
          tax={15}
          className="text-lg font-bold text-theme-700"
          size="lg"
        />
      </div>

      {savings.percent > 0 && (
        <div className="flex flex-col">
          <p className="text-xs font-bold text-gray-500">
            توفر {savings.percent}% مقارنة بالحجز الفردي
          </p>
          <p className="text-xs font-semibold text-gray-400">
            توفير {savings.amount} ريال
          </p>
        </div>
      )}

      <span
        className={cn(buttonVariants({ variant: "primary" }), "mt-auto w-full")}
      >
        احجز الباقة
      </span>
    </Link>
  );
}
