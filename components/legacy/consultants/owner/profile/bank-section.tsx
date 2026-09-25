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
import { Label } from "@/components/ui/label";
import { FormSection } from "./form-section";

// lib
import { checkSaudiIban, formatIbanInput } from "@/lib/iban";

// constants
import { SAUDI_BANKS } from "@/constants/saudi-banks";

// schema
import { type ProfileFormValues } from "@/schemas/consultant/profile";

// icons
import { Landmark } from "lucide-react";

// props
interface Props {
  disabled: boolean;
}

// iban + detected bank + account holder
export function BankSection({ disabled }: Props) {
  const { control } = useFormContext<ProfileFormValues>();

  // detect bank live from the IBAN's embedded SAMA code
  const iban = useWatch({ control, name: "iban" }) ?? "";
  const ibanCheck = checkSaudiIban(iban);
  const bank = ibanCheck.ok ? SAUDI_BANKS[ibanCheck.bankCode] : null;

  return (
    <FormSection
      icon={Landmark}
      title="الحساب البنكي"
      description="لتحويل مستحقاتك، ولا يظهر للعملاء"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* iban */}
        <FormField
          control={control}
          name="iban"
          render={({ field }) => (
            <FormItem>
              <FormLabel>رقم الآيبان (IBAN)</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  // LTR so the 4-digit groups read in the correct order
                  dir="ltr"
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={29}
                  placeholder="SA00 0000 0000 0000 0000 0000"
                  className="font-mono tracking-wider text-left"
                  disabled={disabled}
                  onChange={(e) =>
                    field.onChange(formatIbanInput(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                24 خانة تبدأ بـ SA، تجده في تطبيق البنك
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* detected bank (read-only, derived from IBAN) */}
        <div className="space-y-2">
          <Label>البنك</Label>
          <div className="flex items-center gap-2 h-10 rounded-md border border-zgrey-50 bg-zgrey-50 px-3 text-sm">
            <Landmark className="w-4 h-4 shrink-0 text-zblue-200" />
            {bank ? (
              <span>{bank.ar}</span>
            ) : (
              <span className="text-muted-foreground">
                يظهر تلقائياً بعد إدخال الآيبان
              </span>
            )}
          </div>
        </div>
      </div>

      {/* holder name */}
      <FormField
        control={control}
        name="holderName"
        render={({ field }) => (
          <FormItem>
            <FormLabel>اسم صاحب الحساب</FormLabel>
            <FormControl>
              <Input
                {...field}
                placeholder="الاسم كما هو مسجل في البنك"
                className="sm:max-w-[calc(50%-0.75rem)]"
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>
              يجب أن يطابق اسم صاحب الحساب في البنك
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </FormSection>
  );
}
