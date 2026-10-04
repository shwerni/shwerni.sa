"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { parseISO } from "date-fns";

// components
import { toast } from "@/components/shared/toast";

// actions
import { Pay } from "@/actions/booking";
import { applyCoupon } from "@/actions/site";
import { getConsultantAvailableTimes } from "@/actions/consultant";

// prisma types
import {
  OrderType,
  PaymentMethod,
  SessionType,
  TimingType,
  Weekday,
} from "@/lib/generated/prisma/enums";

// schemas
import { ReservationFormType, reservationSchema } from "@/schemas";

// types
import { Cost, FinanceConfig } from "@/types/data";

// constants
import { itimes } from "@/constants";

// utils
import { cn } from "@/utils/utils";
import { TAX_PERCENT } from "@/utils/tax";
import { calculatePayment } from "@/utils/admin/payments";
import { paymentMethodLabel, phoneNumber } from "@/utils";
import {
  addNMinutes,
  dateToWeekDay,
  getDatesAhead,
  getDayName,
  timeZone,
} from "@/utils/date";

// icons
import { Loader2, MonitorSmartphone, TicketPercent } from "lucide-react";

// props
interface Props {
  cid: number;
  consultant: string;
  cost: Cost;
  original: Cost;
  discountedDurations: number[];
  unavailable: Weekday[];
  finance: FinanceConfig;
  user: { id: string; name: string; phone: string } | null;
}

type Duration = "30" | "45" | "60";
type Slots = Partial<Record<"late" | "day" | "noon" | "night", string[]>>;

const DURATIONS: Duration[] = ["30", "45", "60"];
const PHASES = [
  { key: "late", label: "بعد منتصف الليل" },
  { key: "day", label: "صباحاً" },
  { key: "noon", label: "ظهراً" },
  { key: "night", label: "مساءً" },
] as const;

// methods Pay can hand off to a gateway
const PAY_METHODS: PaymentMethod[] = [
  PaymentMethod.visaMoyasar,
  PaymentMethod.tabby,
];

// booking panel for a center consultant. every price, coupon and the order itself are
// resolved on the server by the same pipeline as the platform (applyCoupon, Pay).
// mode is ONLINE in this phase; the onsite phase adds a mode choice and mode-filtered slots
export function BookingPanel({
  cid,
  consultant,
  cost,
  original,
  discountedDurations,
  unavailable,
  finance,
  user,
}: Props) {
  // session mode (ONLINE only for now)
  const [mode] = React.useState<TimingType>(TimingType.ONLINE);

  // choices
  const [duration, setDuration] = React.useState<Duration>("30");
  const [day, setDay] = React.useState<string | null>(null);
  const [time, setTime] = React.useState<string | null>(null);
  const [slots, setSlots] = React.useState<Slots | null>(null);
  const [loadingSlots, setLoadingSlots] = React.useState(false);

  // client
  const [name, setName] = React.useState(user?.name ?? "");
  const [phone, setPhone] = React.useState(user?.phone ?? "");
  const [notes, setNotes] = React.useState("");

  // coupon
  const [couponInput, setCouponInput] = React.useState("");
  const [coupon, setCoupon] = React.useState<{ code: string; percent: number } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = React.useState(false);

  // payment
  const methods = finance.payments.filter((m) => PAY_METHODS.includes(m));
  const [method, setMethod] = React.useState<PaymentMethod | null>(
    methods[0] ?? null,
  );
  const [accepted, setAccepted] = React.useState(false);
  const [submitting, startSubmit] = React.useTransition();

  // riyadh now + 25 minutes: the earliest bookable time today (same rule as the platform form)
  const now = React.useMemo(() => addNMinutes(timeZone().iso, 25), []);
  const days = React.useMemo(() => getDatesAhead(7, now.iso), [now]);

  // a duration that already has a discount can't take a coupon (Pay enforces the same)
  const durationDiscounted = discountedDurations.includes(Number(duration));
  const couponAllowed = finance.couponEnabled && !durationDiscounted;
  const couponPercent = couponAllowed && coupon ? coupon.percent : 0;

  // display only; Pay recomputes the charged amount on the server
  const price = cost[duration];
  const summary = calculatePayment({
    baseCost: price,
    tax: TAX_PERCENT,
    discountPercent: couponPercent,
  });

  // slots of a day
  async function loadSlots(d: string) {
    setLoadingSlots(true);
    try {
      const data = await getConsultantAvailableTimes(
        cid,
        d,
        dateToWeekDay(parseISO(d)),
        d === now.date ? now.time : undefined,
      );
      setSlots((data as Slots) ?? {});
    } finally {
      setLoadingSlots(false);
    }
  }

  function pickDay(d: string) {
    setDay(d);
    setTime(null);
    setSlots(null);
    loadSlots(d);
  }

  async function checkCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCheckingCoupon(true);
    try {
      const res = await applyCoupon(user?.id ?? "temp", code, cid);
      if (res.state && typeof res.discount === "number" && res.code) {
        setCoupon({ code: res.code, percent: res.discount });
        toast.success({ message: res.message });
      } else {
        setCoupon(null);
        toast.info({ message: res.message });
      }
    } finally {
      setCheckingCoupon(false);
    }
  }

  function submit() {
    if (!day || !time) {
      toast.info({ message: "اختر اليوم والوقت أولاً" });
      return;
    }

    const payload = {
      order: "consultant",
      user: user?.id ?? "temp",
      cid,
      consultant,
      collaboration: null,
      unavailable,
      cost,
      scale: null,
      times: {},
      finance,
      type: OrderType.SCHEDULED,
      sessionType: SessionType.ONCE,
      sessions: 1,
      package: null,
      // utc midnight of the picked day, like the platform form: Pay stores it as yyyy-MM-dd
      date: new Date(day),
      time,
      duration,
      name: name.trim(),
      phone: phoneNumber(phone),
      notes: notes.trim(),
      hasBeneficiary: false,
      method: method ?? undefined,
      hasCoupon: !!couponPercent,
      couponCode: couponPercent ? coupon?.code : undefined,
      couponPercent: couponPercent || undefined,
      acceptTerms: accepted,
    };

    const parsed = reservationSchema.safeParse(payload);
    if (!parsed.success) {
      toast.info({ message: parsed.error.issues[0]?.message ?? "برجاء مراجعة البيانات" });
      return;
    }

    startSubmit(async () => {
      const result = await Pay(parsed.data as ReservationFormType);
      // success redirects to the payment gateway; only failures come back
      if (!result || result.state === false)
        toast.error({
          message: result?.message ?? "حدث خطأ ما، برجاء المحاولة مرة أخرى",
        });
    });
  }

  const step = "flex flex-col gap-3 border-b border-slate-100 pb-5";
  const stepTitle = "text-sm font-bold text-slate-900";
  const chip = (active: boolean) =>
    cn(
      "rounded-xl border px-3 py-2 text-sm transition disabled:pointer-events-none disabled:opacity-35",
      active
        ? "border-transparent text-white"
        : "border-slate-200 bg-white text-slate-700 hover:border-slate-400",
    );
  const activeStyle = { background: "var(--center-accent)" };

  return (
    <section
      id="booking"
      className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-slate-900">احجز جلستك</h2>
        {mode === TimingType.ONLINE && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
            <MonitorSmartphone className="size-3.5" />
            أونلاين
          </span>
        )}
      </div>

      {/* duration */}
      <div className={step}>
        <h3 className={stepTitle}>مدة الجلسة</h3>
        <div className="grid grid-cols-3 gap-2">
          {DURATIONS.map((d) => {
            const active = duration === d;
            const discounted = cost[d] < original[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={cn(chip(active), "flex flex-col items-center gap-0.5")}
                style={active ? activeStyle : undefined}
              >
                <span className="font-semibold">{d} دقيقة</span>
                <span className="text-xs">
                  {cost[d]} ر.س
                  {discounted && (
                    <span className="ms-1 line-through opacity-70">{original[d]}</span>
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* day */}
      <div className={step}>
        <h3 className={stepTitle}>اليوم</h3>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {days.map((d) => {
            const off = unavailable.includes(dateToWeekDay(parseISO(d)));
            return (
              <button
                key={d}
                type="button"
                disabled={off}
                onClick={() => pickDay(d)}
                className={cn(chip(day === d), "flex flex-col items-center")}
                style={day === d ? activeStyle : undefined}
              >
                <span className="text-xs">{getDayName(d)}</span>
                <span className="font-semibold">{d.slice(8)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* time */}
      <div className={step}>
        <h3 className={stepTitle}>الوقت</h3>
        {!day ? (
          <p className="text-sm text-slate-500">اختر يوماً لعرض المواعيد المتاحة</p>
        ) : loadingSlots ? (
          <p className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="size-4 animate-spin" />
            جارٍ تحميل المواعيد
          </p>
        ) : !slots || PHASES.every((p) => !slots[p.key]?.length) ? (
          <p className="text-sm text-slate-500">لا توجد مواعيد متاحة في هذا اليوم</p>
        ) : (
          PHASES.filter((p) => slots[p.key]?.length).map((p) => (
            <div key={p.key} className="flex flex-col gap-2">
              <span className="text-xs text-slate-500">{p.label}</span>
              <div className="flex flex-wrap gap-2">
                {slots[p.key]!.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTime(t)}
                    className={chip(time === t)}
                    style={time === t ? activeStyle : undefined}
                  >
                    {itimes[t]?.label ?? t}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* client */}
      <div className={step}>
        <h3 className={stepTitle}>بياناتك</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="الاسم"
            aria-label="الاسم"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="رقم الجوال (9665XXXXXXXX)"
            aria-label="رقم الجوال"
            inputMode="tel"
            dir="ltr"
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={200}
          rows={2}
          placeholder="ملاحظات للمستشار (اختياري)"
          aria-label="ملاحظات"
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
        />
      </div>

      {/* coupon */}
      {couponAllowed && (
        <div className={step}>
          <h3 className={cn(stepTitle, "inline-flex items-center gap-1.5")}>
            <TicketPercent className="size-4" />
            كوبون خصم
          </h3>
          <div className="flex gap-2">
            <input
              value={couponInput}
              onChange={(e) => {
                setCouponInput(e.target.value);
                setCoupon(null);
              }}
              placeholder="أدخل الكود"
              aria-label="كود الخصم"
              dir="ltr"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm uppercase outline-none focus:border-slate-400"
            />
            <button
              type="button"
              onClick={checkCoupon}
              disabled={checkingCoupon || !couponInput.trim()}
              className="rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-800 disabled:opacity-50"
            >
              {checkingCoupon ? <Loader2 className="size-4 animate-spin" /> : "تطبيق"}
            </button>
          </div>
          {coupon && (
            <p className="text-sm text-emerald-700">
              تم تطبيق خصم {coupon.percent}%
            </p>
          )}
        </div>
      )}

      {/* payment */}
      <div className="flex flex-col gap-3">
        <h3 className={stepTitle}>طريقة الدفع</h3>
        {methods.length === 0 ? (
          <p className="text-sm text-slate-500">الدفع غير متاح حالياً</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={chip(method === m)}
                style={method === m ? activeStyle : undefined}
              >
                {paymentMethodLabel(m)}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-slate-50 p-4 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>سعر الجلسة</span>
            <span>{summary.subTotal} ر.س</span>
          </div>
          <div className="mt-1 flex justify-between font-bold text-slate-900">
            <span>الإجمالي شامل الضريبة</span>
            <span>{summary.totalWTax} ر.س</span>
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={accepted}
            onChange={(e) => setAccepted(e.target.checked)}
            className="mt-1"
          />
          <span>
            أوافق على{" "}
            <Link href="/terms" className="underline" target="_blank">
              الشروط والأحكام
            </Link>
          </span>
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || methods.length === 0}
          className="inline-flex items-center justify-center gap-2 rounded-2xl py-3 font-bold text-white transition disabled:opacity-60"
          style={activeStyle}
        >
          {submitting && <Loader2 className="size-4 animate-spin" />}
          تأكيد الحجز والدفع
        </button>
      </div>
    </section>
  );
}
