"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { parseISO } from "date-fns";

// components
import { toast } from "@/components/shared/toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { BookingSteps } from "@/components/clients/centers/booking/booking-steps";
import { BookingSummary } from "@/components/clients/centers/booking/booking-summary";

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
import { schemas } from "@/schemas/schemas";
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
import {
  ChevronRight,
  CreditCard,
  Loader2,
  MonitorSmartphone,
  TicketPercent,
} from "lucide-react";

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
const STEPS = ["المدة", "اليوم", "الوقت", "بياناتك", "الدفع"];
const LAST = STEPS.length - 1;

// methods Pay can hand off to a gateway
const PAY_METHODS: PaymentMethod[] = [
  PaymentMethod.visaMoyasar,
  PaymentMethod.tabby,
];

// booking for a center consultant as a stepped flow (duration → day → time → details → payment).
// every price, coupon and the order itself are resolved on the server by the same pipeline as
// the platform (applyCoupon, Pay). mode is ONLINE in this phase; the onsite phase adds a mode
// choice and mode-filtered slots
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

  // flow
  const [step, setStep] = React.useState(0);

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

  // the step's requirement before moving on (the final submit validates everything again)
  function stepError(s: number): string | null {
    if (s === 1 && !day) return "اختر اليوم";
    if (s === 2 && !time) return "اختر وقت الجلسة";
    if (s === 3) {
      const n = schemas.name.safeParse(name);
      if (!n.success) return n.error.issues[0]?.message ?? "الاسم غير صالح";
      const p = schemas.phone.safeParse(phoneNumber(phone));
      if (!p.success) return p.error.issues[0]?.message ?? "رقم الجوال غير صالح";
    }
    return null;
  }

  function next() {
    if (step === LAST) return submit();
    const error = stepError(step);
    if (error) {
      toast.info({ message: error });
      return;
    }
    setStep((s) => s + 1);
  }

  const back = () => setStep((s) => Math.max(0, s - 1));
  const ctaLabel = step === LAST ? "تأكيد الحجز والدفع" : "التالي";
  const ctaDisabled = submitting || (step === LAST && methods.length === 0);

  // option rows / chips
  const option = (active: boolean) =>
    cn(
      "rounded-xl border text-sm transition disabled:pointer-events-none disabled:opacity-35",
      active
        ? "border-(--center-accent) bg-(--center-soft) text-(--center-accent-text)"
        : "border-border/70 bg-background hover:border-foreground/30",
    );

  const dayLabel = day ? `${getDayName(day)} ${day.slice(8)}` : null;
  const timeLabel = time ? (itimes[time]?.label ?? time) : null;

  const cta = (
    <button
      type="button"
      onClick={next}
      disabled={ctaDisabled}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-(--center-accent) font-semibold text-(--center-accent-foreground) transition hover:opacity-90 disabled:opacity-60"
    >
      {submitting && <Loader2 className="size-4 animate-spin" />}
      {ctaLabel}
    </button>
  );

  return (
    <>
      <section
        id="booking"
        className="flex scroll-mt-24 flex-col gap-5 rounded-2xl border border-border/70 bg-card p-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">احجز جلستك</h2>
          {mode === TimingType.ONLINE && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
              <MonitorSmartphone className="size-3.5" strokeWidth={1.75} />
              أونلاين
            </span>
          )}
        </div>

        <BookingSteps steps={STEPS} current={step} />

        {/* 1. duration */}
        {step === 0 && (
          <div className="flex flex-col gap-2">
            {DURATIONS.map((d) => {
              const active = duration === d;
              const discounted = cost[d] < original[d];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  aria-pressed={active}
                  className={cn(option(active), "flex items-center justify-between px-4 py-3")}
                >
                  <span className="font-medium">{d} دقيقة</span>
                  <span className="text-sm">
                    {discounted && (
                      <span className="me-2 text-xs text-muted-foreground line-through">
                        {original[d]}
                      </span>
                    )}
                    <span className="font-semibold">{cost[d]}</span> ر.س
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* 2. day */}
        {step === 1 && (
          <div className="grid grid-cols-4 gap-2">
            {days.map((d) => {
              const off = unavailable.includes(dateToWeekDay(parseISO(d)));
              const active = day === d;
              return (
                <button
                  key={d}
                  type="button"
                  disabled={off}
                  onClick={() => pickDay(d)}
                  aria-pressed={active}
                  className={cn(option(active), "flex flex-col items-center gap-0.5 py-2.5")}
                >
                  <span className="text-xs">{getDayName(d)}</span>
                  <span className="text-base font-semibold">{d.slice(8)}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 3. time */}
        {step === 2 &&
          (loadingSlots ? (
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-10 rounded-xl" />
              ))}
            </div>
          ) : !slots || PHASES.every((p) => !slots[p.key]?.length) ? (
            <p className="rounded-xl bg-muted/60 p-4 text-center text-sm text-muted-foreground">
              لا توجد مواعيد متاحة في هذا اليوم، اختر يوماً آخر
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {PHASES.filter((p) => slots[p.key]?.length).map((p) => (
                <div key={p.key} className="flex flex-col gap-2">
                  <span className="text-xs text-muted-foreground">{p.label}</span>
                  <div className="grid grid-cols-3 gap-2">
                    {slots[p.key]!.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTime(t)}
                        aria-pressed={time === t}
                        className={cn(option(time === t), "h-10")}
                      >
                        {itimes[t]?.label ?? t}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* 4. details */}
        {step === 3 && (
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-name">الاسم</Label>
              <Input
                id="booking-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-phone">رقم الجوال</Label>
              <Input
                id="booking-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9665XXXXXXXX"
                inputMode="tel"
                dir="ltr"
                className="h-10 rounded-xl"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="booking-notes">ملاحظات للمستشار (اختياري)</Label>
              <Textarea
                id="booking-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={200}
                rows={3}
                className="rounded-xl"
              />
            </div>
          </div>
        )}

        {/* 5. payment */}
        {step === 4 && (
          <div className="flex flex-col gap-4">
            {couponAllowed && (
              <div className="flex flex-col gap-1.5">
                <Label
                  htmlFor="booking-coupon"
                  className="inline-flex items-center gap-1.5"
                >
                  <TicketPercent className="size-4" strokeWidth={1.75} />
                  كوبون خصم
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="booking-coupon"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCoupon(null);
                    }}
                    dir="ltr"
                    className="h-10 flex-1 rounded-xl uppercase"
                  />
                  <button
                    type="button"
                    onClick={checkCoupon}
                    disabled={checkingCoupon || !couponInput.trim()}
                    className="inline-flex h-10 items-center rounded-xl border border-border px-4 text-sm font-medium transition hover:bg-muted disabled:opacity-50"
                  >
                    {checkingCoupon ? <Loader2 className="size-4 animate-spin" /> : "تطبيق"}
                  </button>
                </div>
                {coupon && (
                  <p className="text-sm text-(--center-accent-text)">
                    تم تطبيق خصم {coupon.percent}%
                  </p>
                )}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">طريقة الدفع</span>
              {methods.length === 0 ? (
                <p className="text-sm text-muted-foreground">الدفع غير متاح حالياً</p>
              ) : (
                methods.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                    className={cn(option(method === m), "flex items-center gap-2 px-4 py-3")}
                  >
                    <CreditCard className="size-4" strokeWidth={1.75} />
                    {paymentMethodLabel(m)}
                  </button>
                ))
              )}
            </div>

            <label className="flex items-start gap-2 text-sm">
              <Checkbox
                checked={accepted}
                onCheckedChange={(v) => setAccepted(v === true)}
                className="mt-0.5"
              />
              <span>
                أوافق على{" "}
                <Link href="/terms" className="underline" target="_blank">
                  الشروط والأحكام
                </Link>
              </span>
            </label>
          </div>
        )}

        {/* desktop: summary + navigation inside the panel */}
        <div className="flex flex-col gap-3 border-t border-border/60 pt-4">
          <BookingSummary
            duration={duration}
            dayLabel={dayLabel}
            timeLabel={timeLabel}
            totalWithTax={summary.totalWTax}
            className="hidden lg:flex"
          />
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={back}
                className="inline-flex h-11 items-center gap-1 rounded-xl px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="size-4" strokeWidth={1.75} />
                رجوع
              </button>
            )}
            <div className="hidden flex-1 lg:block">{cta}</div>
          </div>
        </div>
      </section>

      {/* mobile: sticky summary + cta, above the iphone home indicator */}
      <div
        id="booking-bar"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur lg:hidden"
      >
        <div className="mx-auto flex max-w-xl flex-col gap-2.5">
          <BookingSummary
            duration={duration}
            dayLabel={dayLabel}
            timeLabel={timeLabel}
            totalWithTax={summary.totalWTax}
          />
          {cta}
        </div>
      </div>
    </>
  );
}
