"use client";
// packages
import { useForm, useWatch } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { quotePleading } from "@/actions/pleading";

// utils
import { TAX_PERCENT, withTax } from "@/utils/tax";
import { pleadingErrors, pleadingQuoteSchema } from "@/utils/pleading";

// icons
import { Loader2, Send } from "lucide-react";

type FormValues = { reply: string; price: string };

// the consultant's reply and pre-vat price; posted in the case chat and sent to the client.
// a re-quote (while QUOTED) starts from the current price
export function QuoteForm({
  plid,
  currentPrice,
  onDone,
}: {
  plid: number;
  currentPrice: number | null;
  onDone: () => void;
}) {
  const form = useForm<FormValues>({
    defaultValues: {
      reply: "",
      price: currentPrice ? String(currentPrice) : "",
    },
  });
  const { register, handleSubmit, setError, clearErrors, formState, getValues, reset, control } =
    form;

  const { execute, isPending } = useAction(quotePleading, {
    errors: pleadingErrors,
    loading: "جاري إرسال العرض...",
    success: "تم إرسال العرض للعميل",
    onSuccess: () => {
      reset({ reply: "", price: getValues("price") });
      onDone();
    },
  });

  function onSubmit(values: FormValues) {
    const payload = {
      plid,
      reply: values.reply,
      price: values.price.trim() === "" ? NaN : Number(values.price),
    };

    // the same schema the action checks on the server, for inline messages
    const parsed = pleadingQuoteSchema.safeParse(payload);
    clearErrors();
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "reply" || key === "price")
          setError(key, {
            message:
              key === "price" && issue.code === "invalid_type"
                ? "اكتب السعر بالأرقام"
                : issue.message,
          });
      }
      return;
    }

    execute(parsed.data);
  }

  // the client's total, the same vat math as checkout
  const price = Number(useWatch({ control, name: "price" }));
  const total =
    Number.isInteger(price) && price > 0 ? withTax(price) : null;

  const err = (k: keyof FormValues) => formState.errors[k]?.message;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" dir="rtl">
      <Field data-invalid={!!err("reply")}>
        <FieldLabel htmlFor={`quote-reply-${plid}`}>ردك على العميل</FieldLabel>
        <Textarea
          id={`quote-reply-${plid}`}
          rows={5}
          maxLength={2000}
          placeholder="رأيك في القضية وما تشمله الجلسة"
          disabled={isPending}
          {...register("reply")}
        />
        {err("reply") && <FieldError errors={[{ message: err("reply") }]} />}
      </Field>

      <Field data-invalid={!!err("price")}>
        <FieldLabel htmlFor={`quote-price-${plid}`}>
          سعر الجلسة قبل الضريبة (ريال)
        </FieldLabel>
        <Input
          id={`quote-price-${plid}`}
          type="number"
          inputMode="numeric"
          min={100}
          max={100000}
          step={1}
          dir="ltr"
          placeholder="500"
          disabled={isPending}
          {...register("price")}
        />
        {err("price") && <FieldError errors={[{ message: err("price") }]} />}
      </Field>

      {/* what the client pays */}
      <div className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm space-y-1">
        <div className="flex items-center justify-between text-slate-500">
          <span>السعر قبل الضريبة</span>
          <span className="tabular-nums">{total ? `${price} ريال` : "—"}</span>
        </div>
        <div className="flex items-center justify-between font-semibold text-slate-800">
          <span>إجمالي العميل شامل الضريبة ({TAX_PERCENT}%)</span>
          <span className="tabular-nums">{total ? `${total} ريال` : "—"}</span>
        </div>
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className="w-full bg-theme hover:bg-theme/90 text-white"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {currentPrice ? "تحديث العرض" : "إرسال العرض"}
      </Button>
    </form>
  );
}
