"use client";
// React & Next
import { useRef, useState, type Ref } from "react";

// packages
import type { UseFormReturn } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  MinusIcon,
  PlusIcon,
  SparklesIcon,
} from "@/components/consultant/pleadings/agreement-icons";

// constants
import {
  PLEADING_CASE_TYPE_MAX_CHARS,
  PLEADING_CONSULTANT_TERMS_MAX,
  PLEADING_CONSULTANT_TERM_MAX_CHARS,
  PLEADING_NOTES_MAX_CHARS,
  PLEADING_STATIC_ARTICLE_COUNT,
  PLEADING_SUMMARY_MAX_CHARS,
  articleHeading,
} from "@/constants/pleading-agreement";

// icons
import { ChevronDown, Loader2 } from "lucide-react";

// the quote form's values (the agreement's blocks are all optional)
export type QuoteFormValues = {
  reply: string;
  price: string;
  caseType: string;
  summary: string;
  terms: { value: string }[];
  notes: string;
};

// the quote form's collapsible "engagement agreement" section: case type, the summary (drafted by
// ai, editable), the consultant's special terms numbered after the static articles, and notes.
// the first open drafts the summary when it's empty
export function AgreementFields({
  plid,
  form,
  disabled,
  drafting,
  onDraft,
  fromPrevious,
  detailsRef,
}: {
  plid: number;
  form: UseFormReturn<QuoteFormValues>;
  disabled: boolean;
  drafting: boolean;
  onDraft: () => void;
  // prefilled from the latest version (a re-quote)
  fromPrevious: boolean;
  // the form opens the section when a server error lands on one of its fields
  detailsRef?: Ref<HTMLDetailsElement>;
}) {
  const { register, formState, getValues, setValue } = form;
  const opened = useRef(false);

  // the terms list: the values live in the form ("terms"), the keys here. not useFieldArray:
  // nothing else on the site uses it, and it would grow the shared react-hook-form chunk
  const [rows, setRows] = useState(() => {
    const count = getValues("terms").length;
    return { keys: Array.from({ length: count }, (_, i) => i), next: count };
  });
  const append = () => {
    setValue("terms", [...getValues("terms"), { value: "" }]);
    setRows((r) => ({ keys: [...r.keys, r.next], next: r.next + 1 }));
  };
  const remove = (index: number) => {
    setValue(
      "terms",
      getValues("terms").filter((_, i) => i !== index),
    );
    setRows((r) => ({ ...r, keys: r.keys.filter((_, i) => i !== index) }));
  };

  const err = (k: "caseType" | "summary" | "notes") => formState.errors[k]?.message;
  const termErr = (i: number) => formState.errors.terms?.[i]?.value?.message;

  return (
    <details
      ref={detailsRef}
      className="group rounded-lg border border-slate-200 bg-white"
      onToggle={(e) => {
        // the first open drafts the summary when the consultant hasn't written one
        if (!(e.currentTarget as HTMLDetailsElement).open || opened.current) return;
        opened.current = true;
        if (!getValues("summary").trim()) onDraft();
      }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-3 py-2.5 text-sm font-medium text-slate-800">
        <span>تفاصيل اتفاقية التكليف (اختياري)</span>
        <ChevronDown className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-180" />
      </summary>

      <div className="space-y-4 border-t border-slate-100 px-3 py-3">
        <p className="text-xs text-slate-500">
          تظهر هذه التفاصيل في اتفاقية التكليف (PDF) التي تُرسل في المحادثة بعد العرض، دون
          السعر.
          {fromPrevious && " معبأة من النسخة السابقة."}
        </p>

        <Field data-invalid={!!err("caseType")}>
          <FieldLabel htmlFor={`agreement-case-type-${plid}`}>نوع القضية / الخدمة</FieldLabel>
          <Input
            id={`agreement-case-type-${plid}`}
            maxLength={PLEADING_CASE_TYPE_MAX_CHARS}
            placeholder="مثال: مرافعة تجارية - إعداد لائحة وحضور جلسات"
            disabled={disabled}
            {...register("caseType")}
          />
          {err("caseType") && <FieldError errors={[{ message: err("caseType") }]} />}
        </Field>

        <Field data-invalid={!!err("summary")}>
          <div className="flex items-center justify-between gap-2">
            <FieldLabel htmlFor={`agreement-summary-${plid}`}>ملخص التكليف</FieldLabel>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-theme"
              disabled={disabled || drafting}
              onClick={onDraft}
            >
              {drafting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SparklesIcon className="w-3.5 h-3.5" />
              )}
              إعادة الصياغة
            </Button>
          </div>
          <Textarea
            id={`agreement-summary-${plid}`}
            rows={3}
            maxLength={PLEADING_SUMMARY_MAX_CHARS}
            placeholder={drafting ? "جاري صياغة الملخص..." : "3 أسطر كحد أقصى، دون أسماء أو أسعار"}
            disabled={disabled || drafting}
            {...register("summary")}
          />
          {err("summary") && <FieldError errors={[{ message: err("summary") }]} />}
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-800">الشروط الخاصة</p>
          {rows.keys.map((key, i) => (
            <Field key={key} data-invalid={!!termErr(i)}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor={`agreement-term-${plid}-${i}`}>
                  {articleHeading(PLEADING_STATIC_ARTICLE_COUNT + 1 + i)}
                </FieldLabel>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-slate-500"
                  aria-label="حذف الشرط"
                  disabled={disabled}
                  onClick={() => remove(i)}
                >
                  <MinusIcon className="w-4 h-4" />
                </Button>
              </div>
              <Textarea
                id={`agreement-term-${plid}-${i}`}
                rows={2}
                maxLength={PLEADING_CONSULTANT_TERM_MAX_CHARS}
                disabled={disabled}
                {...register(`terms.${i}.value` as const)}
              />
              {termErr(i) && <FieldError errors={[{ message: termErr(i) }]} />}
            </Field>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || rows.keys.length >= PLEADING_CONSULTANT_TERMS_MAX}
            onClick={append}
          >
            <PlusIcon className="w-4 h-4" />
            إضافة شرط
          </Button>
        </div>

        <Field data-invalid={!!err("notes")}>
          <FieldLabel htmlFor={`agreement-notes-${plid}`}>ملاحظات</FieldLabel>
          <Textarea
            id={`agreement-notes-${plid}`}
            rows={3}
            maxLength={PLEADING_NOTES_MAX_CHARS}
            disabled={disabled}
            {...register("notes")}
          />
          {err("notes") && <FieldError errors={[{ message: err("notes") }]} />}
        </Field>
      </div>
    </details>
  );
}
