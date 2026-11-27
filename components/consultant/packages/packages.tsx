"use client";
// React & Next
import React from "react";

// utils
import {
  belowMinimumWarning,
  checkPrices,
  durationLabel,
  firstPriceError,
  minimumFor,
  minimumLabel,
  packageBelowFloorWarning,
  packageFloorLabel,
} from "@/utils/pricing";

// constants
import { PACKAGE_SESSION_MINUTES, type PricingSettings } from "@/constants/pricing";

// prisma data
import {
  updateConsultantBaseCosts,
  setPackagesDisabled,
  upsertConsultantPackage,
} from "@/actions/consultant";

// the packages page's price fields (from the server page): the pricing settings, the lengths shown
// (his own lengths, plus 45 while he has an active package), his own lengths and his stored prices
interface BaseCostsProps {
  settings: PricingSettings;
  fields: number[];
  durations: number[];
  current: Record<string, number>;
}

export function BaseCostsForm({ settings, fields, durations, current }: BaseCostsProps) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [costs, setCosts] = React.useState<Record<string, number | "">>(() =>
    Object.fromEntries(fields.map((minutes) => [String(minutes), current[String(minutes)] ?? ""])),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // the same rule as the server (the minimums from the pricing settings)
    const check = checkPrices(settings, fields, costs, current);
    if (!check.ok) {
      setError(firstPriceError(check.errors));
      return;
    }

    setError("");
    setLoading(true);
    const result = await updateConsultantBaseCosts(check.costs);
    setLoading(false);
    if (!result.success) setError(result.message ?? "حدث خطأ ما برجاء المحاولة مرة اخري");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col sm:flex-row gap-4 items-end w-full">
        {fields.map((minutes) => {
          const key = String(minutes);
          const min = minimumFor(settings, minutes) ?? 0;
          const value = costs[key];
          const stored = current[key];
          // his stored price under today's minimum, still unchanged: kept, but he's asked to update it
          const belowKept = stored !== undefined && stored < min && value === stored;
          // 45 shown only for his packages: the package session price
          const label =
            minutes === PACKAGE_SESSION_MINUTES && !durations.includes(minutes)
              ? `سعر جلسة الباقة (${durationLabel(minutes)})`
              : durationLabel(minutes);
          return (
            <div key={key} className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {label}
              </label>
              <input
                type="number"
                min={min}
                value={value}
                onChange={(e) =>
                  setCosts({
                    ...costs,
                    [key]: e.target.value === "" ? "" : Number(e.target.value),
                  })
                }
                className="w-full p-2 border rounded-md outline-none focus:border-theme-700"
                required
              />
              <p className="text-xs text-gray-500 mt-1">{minimumLabel(min)}</p>
              {belowKept && (
                <p className="text-xs text-amber-600 mt-1">{belowMinimumWarning(min)}</p>
              )}
            </div>
          );
        })}
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-theme-700 text-white rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-colors w-full sm:w-auto h-10"
        >
          {loading ? "جاري الحفظ..." : "حفظ الأسعار"}
        </button>
      </div>
      
      {/* Error Message Display */}
      {error && (
        <p className="text-red-500 text-sm font-medium mt-1">{error}</p>
      )}
    </form>
  );
}

export function PackageForm({
  consultantId,
  sessionCount,
  initialCost,
  initialActive,
  floor,
}: {
  consultantId: number;
  sessionCount: number;
  initialCost: number;
  initialActive: boolean;
  // the lowest price this package may be saved at (his 45 price × sessions, less the max discount)
  floor: number;
}) {
  const [cost, setCost] = React.useState(initialCost);
  const [isActive, setIsActive] = React.useState(initialActive);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Fix for the useEffect warning: 
  // Track previous props and adjust during render instead of triggering a second render
  const [prevInitialCost, setPrevInitialCost] = React.useState(initialCost);
  const [prevInitialActive, setPrevInitialActive] = React.useState(initialActive);

  if (initialCost !== prevInitialCost || initialActive !== prevInitialActive) {
    setPrevInitialCost(initialCost);
    setPrevInitialActive(initialActive);
    setCost(initialCost);
    setIsActive(initialActive);
  }

  // the server's rule: a new package, a changed price or an activation must reach the floor;
  // deactivating or saving it unchanged is always allowed
  const isNew = initialCost <= 0;
  const edited = isNew || cost !== initialCost || (isActive && !initialActive);
  // a saved, active package below its floor: it keeps selling, he's asked to update it
  const belowFloor = !isNew && initialActive && initialCost < floor && !edited;

  const handleSave = async () => {
    if (edited && cost < floor) {
      setError(packageFloorLabel(floor));
      return;
    }

    setError("");
    setLoading(true);
    const result = await upsertConsultantPackage(
      consultantId,
      sessionCount,
      cost,
      isActive,
    );
    setLoading(false);

    // revalidatePath will refresh the page — server state is source of truth
    if (!result.success) {
      setError(result.message ?? "حدث خطأ ما برجاء المحاولة مرة اخري");
    }
  };

  return (
    <div className="flex flex-col p-4 border rounded-lg bg-gray-50">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-semibold text-gray-800">
            باقة {sessionCount} جلسات
          </span>
          <label className="inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-700"></div>
            <span className="ms-3 text-sm font-medium text-gray-600">
              {isActive ? "مفعل" : "معطل"}
            </span>
          </label>
        </div>

        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">السعر:</label>
            <input
              type="number"
              min={floor}
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-24 p-1.5 border rounded text-center outline-none focus:border-theme-700"
              disabled={!isActive}
            />
          </div>
          <p className="text-xs text-gray-500">{packageFloorLabel(floor)}</p>
          <button
            onClick={handleSave}
            disabled={loading}
            className="text-xs px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
          >
            {loading ? "..." : "تحديث الباقة"}
          </button>
        </div>
      </div>
      
      {/* below the floor, still selling */}
      {belowFloor && (
        <p className="text-amber-600 text-xs mt-2 w-full rtl:text-right">
          {packageBelowFloorWarning(floor)}
        </p>
      )}

      {/* Error Message Display */}
      {error && (
        <p className="text-red-500 text-sm font-medium mt-2 text-left w-full rtl:text-right">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * his "disable all packages" switch: while on, his packages are hidden from clients and can't be
 * booked; they're kept unchanged and come back when it's off. sold packages keep their sessions
 */
export function PackagesSwitch({ initialDisabled }: { initialDisabled: boolean }) {
  const [disabled, setDisabled] = React.useState(initialDisabled);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  const toggle = async (next: boolean) => {
    setError("");
    setLoading(true);
    const result = await setPackagesDisabled(next);
    setLoading(false);
    if (result.success) setDisabled(next);
    else setError("حدث خطأ ما برجاء المحاولة مرة اخري");
  };

  return (
    <div className="flex flex-col gap-2 p-4 border rounded-lg bg-gray-50">
      <label className="inline-flex items-center cursor-pointer gap-3">
        <input
          type="checkbox"
          checked={disabled}
          disabled={loading}
          onChange={(e) => toggle(e.target.checked)}
          className="sr-only peer"
        />
        <div className="relative w-11 h-6 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:inset-s-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-theme-700"></div>
        <span className="text-sm font-semibold text-gray-800">تعطيل جميع الباقات</span>
      </label>
      {disabled && (
        <p className="text-xs text-amber-600">باقاتك مخفية عن العملاء ولا يمكن حجزها</p>
      )}
      {error && <p className="text-red-500 text-xs">{error}</p>}
    </div>
  );
}