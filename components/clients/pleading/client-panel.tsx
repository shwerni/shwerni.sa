"use client";
// components
import { Button } from "@/components/ui/button";
import { CancelDialog } from "@/components/clients/pleading/cancel-dialog";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { PleadingStateBadge } from "@/components/clients/pleading/state-badge";

// hooks
import { usePleadingCase } from "@/components/clients/pleading/use-case";

// prisma types
import { Gender, PleadingState, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { TAX_PERCENT, withTax } from "@/utils/tax";
import {
  isPleadingChatOpen,
  isQuoteOpen,
  pleadingCheckoutNote,
  pleadingClosedNotes,
  pleadingQuoteReply,
} from "@/utils/pleading";

// icons
import {
  CalendarCheck,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  ShieldAlert,
} from "lucide-react";

// riyadh time, rendered only after the client fetch (no server markup to mismatch)
const riyadh = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  });

// the client's side of the case page: the consultant, the quote (reply, price, expiry), the
// booking button (wired in phase 5), cancel. state comes from the same poll as the chat
export function ClientPanel({
  plid,
  token,
  consultant,
}: {
  plid: number;
  token: string;
  consultant: { name: string; title: string; image: string | null; gender: Gender };
}) {
  const { data, mutate } = usePleadingCase(plid, token);

  // the quote message is stamped with quotedAt (see quotePleading)
  const quoteMessage =
    data?.quotedAt &&
    data.messages.find(
      (m) => m.sender === UserRole.OWNER && m.createdAt === data.quotedAt,
    );
  const reply = quoteMessage ? pleadingQuoteReply(quoteMessage.content) : null;

  const quoteOpen =
    !!data &&
    isQuoteOpen({
      state: data.state,
      price: data.price,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });
  const running = data?.checkout === "running";

  return (
    <aside className="space-y-4" dir="rtl">
      {/* the consultant */}
      <section className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <ConsultantImage
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <p className="text-xs text-slate-500">طلب مرافعة رقم {plid}</p>
          <h2 className="font-semibold text-theme-700 truncate">
            {consultant.name}
          </h2>
          {consultant.title && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {consultant.title}
            </p>
          )}
        </div>
        {data && <PleadingStateBadge state={data.state} />}
      </section>

      {!data ? (
        <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : (
        <>
          {/* waiting for the consultant */}
          {data.state === PleadingState.REQUESTED && (
            <div className="flex gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <Clock className="w-4 h-4 shrink-0 mt-0.5 text-theme" />
              <p>
                طلبك عند المستشار الآن. سيصلك إشعار على واتساب عند رده وتحديد سعر
                الجلسة، ويمكنك متابعة المحادثة معه هنا.
              </p>
            </div>
          )}

          {/* the quote */}
          {data.price != null &&
            (data.state === PleadingState.QUOTED ||
              data.state === PleadingState.EXPIRED) && (
              <section className="rounded-xl border border-slate-200 bg-white p-4 space-y-4">
                <h2 className="font-semibold text-slate-900">عرض المستشار</h2>
                {reply && (
                  <p className="text-sm text-slate-700 whitespace-pre-wrap leading-7">
                    {reply}
                  </p>
                )}
                <dl className="text-sm space-y-2 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2.5">
                  <div className="flex justify-between gap-2 text-slate-500">
                    <dt>سعر الجلسة قبل الضريبة</dt>
                    <dd className="tabular-nums">{data.price} ريال</dd>
                  </div>
                  <div className="flex justify-between gap-2 font-semibold text-slate-800">
                    <dt>الإجمالي شامل الضريبة ({TAX_PERCENT}%)</dt>
                    <dd className="tabular-nums">{withTax(data.price)} ريال</dd>
                  </div>
                  <div className="flex justify-between gap-2 text-slate-500">
                    <dt>مدة الجلسة</dt>
                    <dd>60 دقيقة</dd>
                  </div>
                  {data.expiresAt && (
                    <div className="flex justify-between gap-2 text-slate-500">
                      <dt>{quoteOpen ? "صلاحية العرض حتى" : "انتهت صلاحية العرض في"}</dt>
                      <dd className="tabular-nums" dir="ltr">
                        {riyadh(data.expiresAt)}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* booking and payment: wired in phase 5 */}
                {quoteOpen && !running && (
                  <Button
                    type="button"
                    disabled
                    className="w-full bg-theme hover:bg-theme/90 text-white"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    حجز الموعد والدفع
                  </Button>
                )}
              </section>
            )}

          {/* a payment in progress */}
          {running && (
            <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <CreditCard className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{pleadingCheckoutNote}</p>
            </div>
          )}

          {/* cancel, or why the case is closed */}
          {isPleadingChatOpen(data.state) ? (
            !running && <CancelDialog token={token} onDone={() => void mutate()} />
          ) : (
            <div className="flex gap-2 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <Lock className="w-4 h-4 shrink-0 mt-0.5" />
              <p>{pleadingClosedNotes[data.state]}</p>
            </div>
          )}
        </>
      )}

      {/* the private link */}
      <div className="flex gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <ShieldAlert className="w-4 h-4 shrink-0" />
        <p>
          هذه الصفحة خاصة بطلبك، ورابطها هو مفتاح الدخول إليها. لا تشاركه مع أي
          شخص.
        </p>
      </div>
    </aside>
  );
}
