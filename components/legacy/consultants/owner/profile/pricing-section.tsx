"use client";
// packages
import { useFormContext, useWatch } from "react-hook-form";

// components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { FormSection } from "./form-section";

// schema
import { ProfileFormValues, type ProfilePricing } from "@/schemas/consultant/profile";

// utils
import { withTax } from "@/utils/tax";
import {
  belowMinimumWarning,
  durationLabel,
  minimumFor,
  minimumLabel,
} from "@/utils/pricing";

// icons
import { Wallet } from "lucide-react";

// props
interface Props {
  disabled: boolean;
  // the pricing settings, his own lengths and his stored prices (from the server page)
  pricing: ProfilePricing;
}

// session prices: one field per length he sells, with its minimum from the pricing settings
export function PricingSection({ disabled, pricing }: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  // live values so the final price updates while typing
  const prices = useWatch({ control, name: "costs" });

  return (
    <FormSection
      icon={Wallet}
      title="أسعار الجلسات"
      description="بالريال السعودي، شاملة نسبة المنصة وغير شاملة الضريبة"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {pricing.durations.map((minutes) => {
          const key = String(minutes);
          const min = minimumFor(pricing.settings, minutes) ?? 0;
          const value = Number(prices?.[key]) || 0;
          const stored = pricing.current?.[key];
          // his stored price under today's minimum, still unchanged: kept, but he's asked to update it
          const belowKept = stored !== undefined && stored < min && value === stored;
          return (
            <FormField
              key={key}
              control={control}
              name={`costs.${key}`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{durationLabel(minutes)}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        value={field.value ?? ""}
                        type="number"
                        inputMode="decimal"
                        min={min}
                        className="pe-12"
                        disabled={disabled}
                      />
                    </FormControl>
                    <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                      ر.س
                    </span>
                  </div>
                  <FormDescription className="text-xs">{minimumLabel(min)}</FormDescription>
                  {value > 0 && (
                    <FormDescription className="text-xs">
                      {`يدفع العميل ${withTax(value).toFixed(2)} ر.س شامل الضريبة`}
                    </FormDescription>
                  )}
                  {belowKept && (
                    <p className="text-xs text-amber-600">{belowMinimumWarning(min)}</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
          );
        })}
      </div>
    </FormSection>
  );
}
