"use client";
// components
import { QuoteForm } from "@/components/consultant/pleadings/quote-form";
import { DeclineDialog } from "@/components/consultant/pleadings/decline-dialog";
import { PleadingStateBadge } from "@/components/clients/pleading/state-badge";

// hooks
import { usePleadingCase } from "@/components/clients/pleading/use-case";

// prisma types
import { PleadingState } from "@/lib/generated/prisma/enums";

// utils
import { withTax } from "@/utils/tax";
import {
  isPleadingChatOpen,
  pleadingCheckoutNote,
  pleadingClosedNotes,
} from "@/utils/pleading";

// icons
import { CreditCard, FileText, Loader2, Lock } from "lucide-react";

// riyadh time, rendered only after the client fetch (no server markup to mismatch)
const riyadh = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  });

// the consultant's side panel: case details, the quote form, decline. state comes from the
// same poll as the chat, so a client cancel, an expiry or a running payment shows up live
export function CasePanel({
  plid,
  clientName,
  requestedOn,
}: {
  plid: number;
  clientName: string;
  requestedOn: string | null;
}) {
  const { data, mutate } = usePleadingCase(plid);

  const refresh = () => void mutate();

  return (
    <aside className="space-y-4" dir="rtl">
      {/* details */}
      <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 font-semibold text-slate-900">
            <FileText className="w-4 h-4 text-theme" />
            تفاصيل الطلب
          </h2>
          {data && <PleadingStateBadge state={data.state} />}
        </div>

        <dl className="text-sm space-y-2">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">رقم الطلب</dt>
            <dd className="font-medium tabular-nums">#{plid}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">العميل</dt>
            <dd className="font-medium truncate">{clientName}</dd>
          </div>
          {requestedOn && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">تاريخ الطلب</dt>
              <dd className="font-medium tabular-nums">{requestedOn}</dd>
            </div>
          )}
          {data?.price != null && (
            <>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">السعر قبل الضريبة</dt>
                <dd className="font-medium tabular-nums">{data.price} ريال</dd>
              </div>
              <div className="flex justify-between gap-2">
                <dt className="text-slate-500">إجمالي العميل</dt>
                <dd className="font-medium tabular-nums">
                  {withTax(data.price)} ريال
                </dd>
              </div>
            </>
          )}
          {data?.state === PleadingState.QUOTED && data.expiresAt && (
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">صلاحية العرض حتى</dt>
              <dd className="font-medium tabular-nums" dir="ltr">
                {riyadh(data.expiresAt)}
              </dd>
            </div>
          )}
        </dl>
      </section>

      {/* actions */}
      {!data ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : data.checkout === "running" ? (
        <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{pleadingCheckoutNote}</p>
        </div>
      ) : isPleadingChatOpen(data.state) ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              {data.state === PleadingState.QUOTED
                ? "تعديل العرض"
                : "الرد وتحديد السعر"}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              يُرسل ردك في المحادثة ويصل العميل رابط لحجز جلسة مدتها 60 دقيقة
              بهذا السعر. العرض صالح 7 أيام.
            </p>
          </div>
          <QuoteForm
            key={data.price ?? 0}
            plid={plid}
            currentPrice={data.price}
            onDone={refresh}
          />
          <DeclineDialog plid={plid} onDone={refresh} />
        </section>
      ) : (
        <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          <Lock className="w-4 h-4 shrink-0 mt-0.5" />
          <p>{pleadingClosedNotes[data.state]}</p>
        </div>
      )}
    </aside>
  );
}
