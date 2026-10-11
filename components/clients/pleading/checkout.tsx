"use client";
// React & Next
import { useState } from "react";

// packages
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { useForm, useWatch } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TermsForm from "@/components/clients/consultants/reservation/forms/terms";
import MethodForm from "@/components/clients/consultants/reservation/forms/method";
import StepDateTime from "@/components/clients/consultants/reservation/steps/date-time";
import { Stepper } from "@/components/clients/consultants/reservation/stepper";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { checkoutPleading } from "@/actions/pleading";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// schemas
import type { ReservationFormType } from "@/schemas";

// types
import type { FinanceConfig } from "@/types/data";

// utils
import { timeOptions } from "@/utils";
import { TAX_PERCENT, withTax } from "@/utils/tax";
import {
  PLEADING_DURATION,
  pleadingCheckoutSchema,
  pleadingErrors,
} from "@/utils/pleading";

// icons
import { ChevronRight, CreditCard, Loader2 } from "lucide-react";

// the pleading checkout: the booking flow's own date-time step, terms and payment method forms
// (no coupons), on a form of the booking form's type so they're reused unchanged. the price and
// the 60 minute duration only feed the step's labels: the action sends the token, date, time,
// method and terms, and the server prices the order from the stored quote
export function PleadingCheckout({
  token,
  cid,
  consultant,
  price,
  finance,
  unavailable,
  onCancel,
}: {
  token: string;
  cid: number;
  consultant: string;
  price: number;
  finance: FinanceConfig;
  unavailable: Weekday[];
  onCancel: () => void;
}) {
  const [step, setStep] = useState(0);

  const form = useForm<ReservationFormType>({
    defaultValues: {
      order: "pleading",
      user: "temp",
      cid,
      consultant,
      cost: { 30: price, 45: price, 60: price },
      finance: { ...finance, couponEnabled: false },
      unavailable,
      duration: PLEADING_DURATION,
      name: "",
      phone: "",
      notes: "",
      hasBeneficiary: false,
      package: null,
    },
    shouldUnregister: false,
  });

  const [date, time] = useWatch({
    control: form.control,
    name: ["date", "time"],
  });
  const timeLabel = timeOptions.find((t) => t.value === time)?.label;

  const { execute, isPending } = useAction(checkoutPleading, {
    errors: pleadingErrors,
    loading: "جاري تحويلك إلى صفحة الدفع...",
  });

  // step 1: a date and a time
  const toPayment = () => {
    form.clearErrors();
    if (!form.getValues("date"))
      return form.setError("date", { message: "التاريخ مطلوب" });
    if (!form.getValues("time"))
      return form.setError("time", { message: "اختر وقت الجلسة" });
    setStep(1);
  };

  // step 2: the same schema the action checks
  const submit = () => {
    const v = form.getValues();
    const parsed = pleadingCheckoutSchema.safeParse({
      token,
      date: v.date,
      time: v.time,
      method: v.method,
      acceptTerms: v.acceptTerms,
    });
    form.clearErrors();
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "method" || key === "acceptTerms")
          form.setError(key, { message: issue.message });
      }
      return;
    }
    execute(parsed.data);
  };

  const err = form.formState.errors;

  return (
    <Dialog open onOpenChange={(open) => !open && !isPending && onCancel()}>
      <DialogContent
        dir="rtl"
        className="text-right sm:max-w-2xl max-h-[90vh] overflow-y-auto space-y-2"
      >
        <DialogHeader className="text-right!">
          <DialogTitle>حجز الموعد والدفع</DialogTitle>
          <DialogDescription>
            جلسة مدتها 60 دقيقة مع {consultant} بسعر العرض
          </DialogDescription>
        </DialogHeader>

        <Stepper step={step} steps={["التاريخ والوقت", "التأكيد والدفع"]} />

        {step === 0 ? (
          <div className="space-y-2">
            <StepDateTime form={form} onNext={toPayment} />
            {(err.date || err.time) && (
              <p className="text-xs text-red-600">
                {err.date?.message ?? err.time?.message}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-5">
            {/* summary */}
            <dl className="text-sm space-y-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
              {date && (
                <div className="flex justify-between gap-2 text-slate-600">
                  <dt>الموعد</dt>
                  <dd>
                    {format(date, "EEEE، d MMMM", { locale: ar })}
                    {timeLabel ? ` - ${timeLabel}` : ""}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-2 text-slate-500">
                <dt>مدة الجلسة</dt>
                <dd>60 دقيقة</dd>
              </div>
              <div className="flex justify-between gap-2 text-slate-500">
                <dt>سعر الجلسة قبل الضريبة</dt>
                <dd className="tabular-nums">{price} ريال</dd>
              </div>
              <div className="flex justify-between gap-2 font-semibold text-slate-800">
                <dt>الإجمالي شامل الضريبة ({TAX_PERCENT}%)</dt>
                <dd className="tabular-nums">{withTax(price)} ريال</dd>
              </div>
            </dl>

            <MethodForm form={form} />
            <TermsForm form={form} />

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setStep(0)}
              >
                <ChevronRight className="w-4 h-4" />
                الموعد
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={submit}
                className="bg-theme hover:bg-theme/90 text-white"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                الدفع {withTax(price)} ريال
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
