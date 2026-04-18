"use client";
// packages
import { ar } from "date-fns/locale";
import { addDays, format, isAfter, isBefore, startOfDay } from "date-fns";

// utils
import { cn } from "@/lib/utils";

// prisma types
import { Categories, Gender } from "@/lib/generated/prisma/enums";
import { categories } from "@/constants/admin";
import { Separator } from "@/components/ui/separator";

// genders
const genders = [
  { value: Gender.MALE, label: "ذكر" },
  { value: Gender.FEMALE, label: "أنثى" },
];

export default function DateStep({
  days,
  iso,
  onSelect,
  gender,
  setGender,
  category,
  setCategory,
}: {
  days: string[];
  iso: Date | string;
  onSelect: (d: string) => void;
  gender: Gender | null;
  setGender: (g: Gender | null) => void;
  category: Categories | null;
  setCategory: (c: Categories | null) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
      {/* filters */}
      <div className="space-y-5">
        {/* gender Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            النوع (اختياري)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGender(null)}
              className={cn(
                "px-6 py-2 rounded-xl border transition-all duration-150 active:scale-95 shadow-sm text-sm font-medium",
                gender === null
                  ? "bg-theme text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#094577]/40",
              )}
            >
              الكل
            </button>
            {genders.map((opt) => {
              const isActive = gender === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setGender(isActive ? null : opt.value)}
                  className={cn(
                    "px-6 py-2 rounded-xl border transition-all duration-150 active:scale-95 shadow-sm text-gray-600 text-sm font-medium",
                    isActive
                      ? opt.value === Gender.MALE
                        ? "bg-blue-200 border-blue-200"
                        : "bg-pink-200 border-pink-2000"
                      : "bg-white border-gray-200 hover:border-[#094577]/40",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* category Filter */}
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            التخصص (اختياري)
          </h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCategory(null)}
              className={cn(
                "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-95 shadow-sm",
                category === null
                  ? "bg-theme text-white"
                  : "bg-white border-gray-200 text-gray-600 hover:border-[#094577]/40",
              )}
            >
              الكل
            </button>
            {categories.map((opt) => {
              const isActive = category === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCategory(isActive ? null : opt.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-150 active:scale-95 shadow-sm",

                    isActive
                      ? opt.style
                      : "bg-white border-gray-200 text-gray-600 hover:border-[#094577]/40",
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* separator */}
      <Separator className="w-10/12 max-w-90 mx-auto" />

      {/* dates */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-theme">اختر اليوم</h3>
        <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 lg:grid-cols-6 gap-3">
          {days.map((d) => {
            const dateObj = new Date(d);
            const disabled =
              isBefore(dateObj, startOfDay(iso)) ||
              isAfter(dateObj, addDays(iso, 10));

            return (
              <button
                key={d}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(d)}
                className={cn(
                  "flex flex-col items-center justify-center rounded-2xl py-5 border",
                  "transition-all duration-200 active:scale-95",
                  disabled
                    ? "opacity-30 pointer-events-none bg-gray-50 border-gray-100"
                    : "bg-white border-gray-200 hover:border-[#094577]/40 hover:shadow-sm",
                )}
              >
                <span className="text-xs text-gray-400 font-medium">
                  {format(dateObj, "EEE", { locale: ar })}
                </span>
                <span className="text-3xl font-bold text-[#094577] my-1 leading-none">
                  {format(dateObj, "d")}
                </span>
                <span className="text-[11px] text-gray-400">
                  {format(dateObj, "MMM", { locale: ar })}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
