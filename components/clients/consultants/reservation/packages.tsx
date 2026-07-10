// components
import { Button } from "@/components/ui/button";
import CurrencyLabel from "../../shared/currency-label";

// prisma types
import { Package, SessionType } from "@/lib/generated/prisma/browser";

// schema
import { ReservationFormType } from "@/schemas";

// utils
import { cn } from "@/lib/utils";

// types
import { Cost } from "@/types/data";

// icons
import { BadgePercent, Check } from "lucide-react";

import { UseFormReturn } from "react-hook-form";

// props
interface Props {
  costs: Cost;
  packages: Package[];
  form: UseFormReturn<ReservationFormType>;
}

const Packages = ({ packages, costs, form }: Props) => {
  if (packages.length === 0) return;

  const selectedSessions = form.watch("sessions");
  const sessionType = form.watch("sessionType");
  const isPackageSelected = sessionType === SessionType.MULTIPLE;

  return (
    <div className="mx-3 space-y-4 mb-10">
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
          const isActive = isPackageSelected && selectedSessions === pkg.count;

          return (
            pkg.isActive && (
              <div
                key={pkg.id}
                onClick={() => {
                  form.setValue("cost", { "30": pkg.cost, "60": costs[60] });
                  form.setValue("sessionType", SessionType.MULTIPLE);
                  form.setValue("sessions", pkg.count);
                  form.setValue("package", pkg.id);
                }}
                className={cn(
                  "flex flex-col justify-between sm:items-center sm:flex-row gap-5 max-w-10/12 sm:max-w-xl border rounded-md py-3 px-4 cursor-pointer transition-all duration-150",
                  isActive
                    ? "border-[#094577] bg-blue-50 ring-1 ring-[#094577]/20"
                    : index % 2 === 0
                      ? "bg-[#F1F8FE] border-[#E5E7EB]"
                      : "bg-[#F9FAFB] border-[#E5E7EB]",
                )}
              >
                <div className="flex flex-row-reverse sm:flex-row justify-between gap-5">
                  {/* selector circle / checkmark */}
                  <div className="flex items-center gap-2.5">
                    {isActive ? (
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#094577] shrink-0">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full border-[1.5px] border-gray-300 shrink-0" />
                    )}
                    <h3
                      className={cn(
                        "text-base lg:text-lg font-bold w-22",
                        isActive ? "text-[#094577]" : "text-gray-700",
                      )}
                    >
                      {pkg.count} جلسات
                    </h3>
                  </div>

                  <CurrencyLabel
                    amount={pkg.cost}
                    tax={15}
                    className={cn(
                      "text-lg font-bold",
                      isActive ? "text-[#094577]" : "text-[#094577]",
                    )}
                    size="lg"
                  />
                </div>

                <div className="flex items-center justify-between gap-5">
                  {percent > 0 && (
                    <div className="flex flex-col">
                      <p className="text-gray-500 font-bold text-xs">
                        توفر {Math.round(percent)}% مقارنة بالحجز الفردي
                      </p>
                      <p className="text-xs text-gray-400 font-semibold">
                        لقد وفرت {savingsAmount} ريال
                      </p>
                    </div>
                  )}
                  <Button
                    variant="primary"
                    className="px-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      form.setValue("cost", {
                        "30": pkg.cost,
                        "60": costs[60],
                      });
                      form.setValue("sessionType", SessionType.MULTIPLE);
                      form.setValue("sessions", pkg.count);
                      form.setValue("package", pkg.id);
                    }}
                  >
                    {isActive ? "تم الاختيار" : "اختر الآن"}
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
