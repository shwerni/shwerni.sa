"use client";
// React & Next
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

// components
import { Button } from "@/components/ui/button";
import { PleadingCheckout } from "@/components/clients/pleading/checkout";
import { CancelDialog } from "@/components/clients/pleading/cancel-dialog";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { PleadingStateBadge } from "@/components/clients/pleading/state-badge";

// hooks
import { usePleadingCase } from "@/components/clients/pleading/use-case";

// prisma types
import {
  Gender,
  PleadingState,
  UserRole,
  Weekday,
} from "@/lib/generated/prisma/enums";

// types
import type { FinanceConfig } from "@/types/data";

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
  CircleCheck,
  Clock,
  CreditCard,
  Loader2,
  Lock,
  MessageSquareMore,
  ShieldAlert,
} from "lucide-react";

// riyadh time, rendered only after the client fetch (no server markup to mismatch)
const riyadh = (iso: string) =>
  new Date(iso).toLocaleString("en-GB", {
    timeZone: "Asia/Riyadh",
    dateStyle: "medium",
    timeStyle: "short",
  });

// the paid case's session, looked up on the server (getPaidPleadingSession)
type PaidSession = {
  oid: number;
  mid: string;
  date: string;
  time: string;
  participant: string | null;
};

// the client's side of the case page: the consultant, the quote (reply, price, expiry), the
// checkout (date and time, terms, method, then the gateway), cancel, and the paid view. state
// comes from the same poll as the chat
export function ClientPanel({
  plid,
  token,
  consultant,
  booking,
  paid,
}: {
  plid: number;
  token: string;
  consultant: {
    name: string;
    title: string;
    image: string | null;
    gender: Gender;
  };
  // what the date-time step and the method form need
  booking: { cid: number; finance: FinanceConfig; unavailable: Weekday[] };
  paid: PaidSession | null;
}) {
  const router = useRouter();
  const { data, mutate } = usePleadingCase(plid, token);
  const [checkingOut, setCheckingOut] = useState(false);

  // paid while the page was open: reload the server part (the session and its chat link)
  const isPaid = data?.state === PleadingState.PAID;
  useEffect(() => {
    if (isPaid && !paid) router.refresh();
  }, [isPaid, paid, router]);

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
                طلبك عند المستشار الآن. سيصلك إشعار على واتساب عند رده وتحديد
                سعر الجلسة، ويمكنك متابعة المحادثة معه هنا.
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
                      <dt>
                        {quoteOpen
                          ? "صلاحية العرض حتى"
                          : "انتهت صلاحية العرض في"}
                      </dt>
                      <dd className="tabular-nums" dir="ltr">
                        {riyadh(data.expiresAt)}
                      </dd>
                    </div>
                  )}
                </dl>

                {/* booking and payment */}
                {quoteOpen && !running && !checkingOut && (
                  <Button
                    type="button"
                    onClick={() => setCheckingOut(true)}
                    className="w-full bg-theme hover:bg-theme/90 text-white"
                  >
                    <CalendarCheck className="w-4 h-4" />
                    حجز الموعد والدفع
                  </Button>
                )}
              </section>
            )}

          {/* the checkout */}
          {quoteOpen && !running && checkingOut && data.price != null && (
            <PleadingCheckout
              token={token}
              cid={booking.cid}
              consultant={consultant.name}
              price={data.price}
              agreementUrl={data.agreementUrl}
              finance={booking.finance}
              unavailable={booking.unavailable}
              onCancel={() => setCheckingOut(false)}
            />
          )}

          {/* paid: the session and its chat (the case chat continues there) */}
          {isPaid && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
              <h2 className="flex items-center gap-2 font-semibold text-emerald-800">
                <CircleCheck className="w-4 h-4" />
                تم الدفع وتأكيد الجلسة
              </h2>
              {paid ? (
                <>
                  <dl className="text-sm space-y-1.5 text-slate-700">
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">رقم الطلب</dt>
                      <dd className="tabular-nums">#{paid.oid}</dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">الموعد</dt>
                      <dd className="tabular-nums" dir="ltr">
                        {paid.date} {paid.time}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt className="text-slate-500">مدة الجلسة</dt>
                      <dd>60 دقيقة</dd>
                    </div>
                  </dl>
                  {paid.participant && (
                    <Button
                      asChild
                      className="w-full bg-theme hover:bg-theme/90 text-white"
                    >
                      <Link
                        href={`/chats/${paid.mid}?participant=${paid.participant}`}
                      >
                        <MessageSquareMore className="w-4 h-4" />
                        محادثة الجلسة
                      </Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="flex justify-center py-2 text-emerald-700">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </div>
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
            !running &&
            !checkingOut && (
              <CancelDialog token={token} onDone={() => void mutate()} />
            )
          ) : isPaid ? null : (
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
