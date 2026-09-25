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

// icons
import { Wallet } from "lucide-react";
import { ProfileFormValues } from "@/schemas/consultant/profile";

// VAT shown to the consultant as the client-facing price
const VAT_RATE = 0.15;

// display-only minimums; the schema remains the source of truth
const PRICE_FIELDS = [
  { name: "cost30", label: "30 دقيقة", min: 120 },
  { name: "cost45", label: "45 دقيقة", min: 155 },
  { name: "cost60", label: "60 دقيقة", min: 175 },
] as const;

// props
interface Props {
  disabled: boolean;
}

// session prices per duration
export function PricingSection({ disabled }: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  // live values so the final price updates while typing
  const prices = useWatch({ control, name: ["cost30", "cost45", "cost60"] });

  return (
    <FormSection
      icon={Wallet}
      title="أسعار الجلسات"
      description="بالريال السعودي، شاملة نسبة المنصة وغير شاملة الضريبة"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        {PRICE_FIELDS.map((price, index) => {
          const value = Number(prices[index]) || 0;
          return (
            <FormField
              key={price.name}
              control={control}
              name={price.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{price.label}</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        inputMode="decimal"
                        min={price.min}
                        className="pe-12"
                        disabled={disabled}
                      />
                    </FormControl>
                    <span className="pointer-events-none absolute inset-y-0 inset-e-3 flex items-center text-xs text-muted-foreground">
                      ر.س
                    </span>
                  </div>
                  <FormDescription className="text-xs">
                    {value > 0
                      ? `يدفع العميل ${(value * (1 + VAT_RATE)).toFixed(2)} ر.س شامل الضريبة`
                      : `الحد الأدنى ${price.min} ر.س`}
                  </FormDescription>
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
