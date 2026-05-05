// components
import { Button } from "@/components/ui/button";
import CurrencyLabel from "../../shared/currency-label";

// prisma types
import { Package } from "@/lib/generated/prisma/client";

// types
import { Cost } from "@/types/data";
import { cn } from "@/lib/utils";
import { BadgePercent } from "lucide-react";

// props
interface Props {
  costs: Cost;
  packages: Package[];
}

const Packages = ({ packages, costs }: Props) => {
  // validate
  if (packages.length === 0) return;

  return (
    <div className="mx-3 space-y-4">
      <div className="inline-flex items-center gap-2">
        <BadgePercent className="w-5 h-5 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">
          الباقات التوفيرية
        </h4>
      </div>
      <div className="flex flex-col gap-3 mx-auto">
        {packages.slice(0, 3).map((pkg, index) => {
          const percent = (1 - pkg.cost / (costs[30] * pkg.count)) * 100;
          const savingsAmount = costs[30] * pkg.count - pkg.cost;
          return (
            pkg.isActive && (
              <div
                key={pkg.id}
                className={cn(
                  "flex flex-col justify-between lg:items-center lg:flex-row gap-5 max-w-xs lg:max-w-xl border border-[#E5E7EB] rounded-md py-3 px-4",
                  index % 2 === 0 ? "bg-[#F1F8FE]" : "bg-[#F9FAFB]",
                )}
              >
                <div className="flex flex-row-reverse lg:flex-row justify-between lg:gap-5">
                  <h3 className="text-base lg:text-lg font-bold text-gray-700 w-22">
                    {pkg.count} جلسات
                  </h3>
                  <CurrencyLabel
                    amount={pkg.cost}
                    tax={15}
                    className="text-[#094577] text-lg font-bold"
                    size="lg"
                  />
                </div>
                <div className="flex items-center justify-between lg:gap-5">
                  {percent > 0 && (
                    <div className="flex flex-col">
                      <p className="text-gray-500 font-bold text-xs">
                        توفر {Math.round(percent)}% مقارنة بالحجز الفردي{" "}
                      </p>
                      <p className="text-xs text-gray-400 font-semibold">
                        لقد وفرت {savingsAmount} ريال
                      </p>
                    </div>
                  )}
                  <Button variant="primary" className="px-8">
                    اختر الآن
                  </Button>
                </div>
              </div>
            )
          );
        })}
      </div>
    </div>
  );
};

export default Packages;
