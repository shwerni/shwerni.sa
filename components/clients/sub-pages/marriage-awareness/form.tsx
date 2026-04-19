"use client";
// React & Next
import React from "react";

// packages
import { z } from "zod";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useForm, Controller, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isSameDay, startOfDay, addDays } from "date-fns";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import StepPayment from "./payment";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { Separator } from "@/components/ui/separator";
import PhoneInput from "@/components/shared/phone-input";
import CurrencyLabel from "@/components/clients/shared/currency-label";
import DaysButtons from "@/components/clients/consultants/days-buttons";

// utils
import { cn } from "@/lib/utils";
import { dateToString } from "@/utils/time";
import { timeOptions, phoneNumber } from "@/utils";
import { calculatePayment } from "@/utils/admin/payments";
import { add25Minutes, dateToWeekDay, getDatesAhead } from "@/utils/date";

// lib
import { timeZone } from "@/lib/site/time";

// handlers
import { Pay } from "@/handlers/admin/order/payment";
import { runRecaptcha } from "@/handlers/admin/recaptcha";

// schema
import { reservationSchema } from "@/schemas";

// data
import { getConsultantAvailableTimes } from "@/data/consultant";

// auth
import { User } from "next-auth";

// types
import { FinanceConfig } from "@/types/data";

// prisma types
import { Gender, Weekday } from "@/lib/generated/prisma/enums";

// icons
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Moon,
  Sun,
  Sunrise,
  Sunset,
  Venus,
  Mars,
  CircleAlert,
} from "lucide-react";
import { CalendarIcon } from "lucide-react";
type AwarenessFormType = z.infer<typeof reservationSchema>;

const phaseMeta = {
  late: {
    label: "منتصف الليل",
    Icon: Moon,
    range: "12:00 ص - 4:30 م",
    style: "text-gray-500",
  },
  day: {
    label: "الصباح",
    Icon: Sunrise,
    range: "04:30 ص - 12:00 م",
    style: "text-yellow-500",
  },
  noon: {
    label: "الظهيرة",
    Icon: Sun,
    range: "12:00 م - 06:00 م",
    style: "text-amber-500",
  },
  night: {
    label: "المساء",
    Icon: Sunset,
    range: "06:00 م - 12:00 ص",
    style: "text-black",
  },
} as const;

interface Props {
  cid: number;
  consultant: string;
  unavailable: Weekday[];
  cost: number;
  finance: FinanceConfig;
  user?: User;
}

export default function AwarenessForm({
  cid,
  consultant,
  unavailable,
  cost,
  finance,
  user,
}: Props) {
  const [step, setStep] = React.useState(0);
  const [loadingTimes, setLoadingTimes] = React.useState(false);
  const { executeRecaptcha } = useGoogleReCaptcha();

  const steps = ["الموعد", "البيانات", "التأكيد والدفع"];

  const { iso: initial } = timeZone();
  const {
    date: iso,
    iso: nDate,
    time,
  } = React.useMemo(() => add25Minutes(initial), [initial]);
  const days = getDatesAhead(7, nDate);

  const form = useForm<AwarenessFormType>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "temp",
      order: "consultant",
      cid,
      consultant,
      duration: "60",
      cost: { 60: 304, 30: 152 },
      finance,
      notes: "",
      unavailable,
      name: "",
      phone: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // states
  const selectedDate = useWatch({ control: form.control, name: "date" });
  const selectedTime = useWatch({ control: form.control, name: "time" });
  const selectedGender = useWatch({ control: form.control, name: "gender" });
  const times = useWatch({ control: form.control, name: "times" });

  const timeByValue = React.useMemo(
    () =>
      Object.fromEntries(
        timeOptions.map((t) => [t.value, { label: t.label, phase: t.phase }]),
      ),
    [],
  );

  async function fetchTimes(date: Date) {
    setLoadingTimes(true);
    const data = await getConsultantAvailableTimes(
      cid,
      dateToString(date),
      dateToWeekDay(date),
      isSameDay(date, iso) ? time : undefined,
    );
    form.setValue("times", data, { shouldValidate: false });
    setLoadingTimes(false);
  }

  const stepFields: Record<number, (keyof AwarenessFormType)[]> = {
    0: ["gender", "date", "time"],
    1: ["name", "phone"],
    2: ["method", "acceptTerms"],
  };

  async function handleNext() {
    const isValid = await form.trigger(stepFields[step]);
    if (!isValid) {
      toast.info({ title: steps[step], message: "الرجاء ملء الحقول المطلوبة" });
      return;
    }
    setStep((s) => s + 1);
    document
      .getElementById("awareness-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleBack() {
    setStep((s) => s - 1);
  }

  async function onSubmit(data: AwarenessFormType) {
    // recaptcha
    const token = await runRecaptcha(executeRecaptcha);

    // validate
    if (!token) return;

    // fixed 60-min duration for this product
    const payment = calculatePayment({
      baseCost: cost,
      tax: finance.tax,
      discountPercent: 0,
    });

    data.phone = phoneNumber(data.phone);

    // scale // later daynmic
    data.scale =
      form.getValues("gender") === Gender.MALE
        ? "735e8e69-fcf7-47ff-a3ec-e8302bb2985f"
        : "763594ee-8459-4339-a5dc-4184dd1efdfb";

    await Pay(
      { ...data, gender: data.gender },
      payment.total,
      payment.totalWTax,
    );
  }

  return (
    <div id="awareness-form" className="space-y-3">
      {/* header chip */}
      <div className="w-fit mx-auto flex items-center gap-2 px-5 py-1.5 rounded-full bg-white border border-blue-100 shadow-sm">
        <CalendarDays className="text-theme w-5" />
        <h3 className="text-base font-semibold">احجز جلستك</h3>
      </div>

      <div className="bg-white rounded-2xl border border-blue-100 shadow-sm">
        {/* step indicator */}
        <div className="flex border-b border-gray-100">
          {steps.map((label, i) => (
            <div
              key={i}
              className={cn(
                "flex-1 py-3 text-center text-sm font-medium transition-colors",
                i === step
                  ? "text-theme border-b-2 border-theme"
                  : i < step
                    ? "text-gray-400"
                    : "text-gray-300",
              )}
            >
              <span className="me-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold bg-current/10">
                {i + 1}
              </span>
              {label}
            </div>
          ))}
        </div>

        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="p-5 sm:p-7 space-y-6"
        >
          {step === 0 && (
            <div className="space-y-6">
              {/* gender */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#094577]">
                  <span className="text-red-500">* </span>الجنس
                </p>
                <Controller
                  name="gender"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      <div className="flex gap-3">
                        {/* male */}
                        <button
                          type="button"
                          onClick={() => field.onChange(Gender.MALE)}
                          className={cn(
                            "flex-1 flex justify-center items-center gap-2 py-4 rounded-xl border-2 transition-all",
                            field.value === Gender.MALE
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-gray-50 text-gray-500 hover:border-blue-200",
                          )}
                        >
                          <Mars className="w-5 h-5" />
                          <span className="text-sm font-semibold">ذكر</span>
                        </button>
                        {/* female */}
                        <button
                          type="button"
                          onClick={() => field.onChange(Gender.FEMALE)}
                          className={cn(
                            "flex-1 flex justify-center items-center gap-2 py-4 rounded-xl border-2 transition-all",
                            field.value === Gender.FEMALE
                              ? "border-pink-500 bg-pink-50 text-pink-700"
                              : "border-gray-200 bg-gray-50 text-gray-500 hover:border-pink-200",
                          )}
                        >
                          <Venus className="w-6 h-6" />
                          <span className="text-sm font-semibold">أنثى</span>
                        </button>
                      </div>
                      {fieldState.invalid && (
                        <p className="text-xs text-red-500">
                          {fieldState.error?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              <Separator />

              {/* date picker */}
              <div className="space-y-3">
                <p className="text-sm font-semibold text-[#094577]">
                  <span className="text-red-500">* </span>التاريخ
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {days.map((d, index) => (
                    <div
                      key={index}
                      onClick={() => {
                        if (
                          new Date(d) < startOfDay(iso) ||
                          new Date(d) > addDays(iso, 10) ||
                          unavailable.includes(dateToWeekDay(new Date(d)))
                        )
                          return;
                        form.setValue("date", new Date(d));
                        // @ts-expect-error reset time
                        setValue("time", undefined);
                        fetchTimes(new Date(d));
                      }}
                      className={cn(
                        new Date(d) < startOfDay(iso) ||
                          new Date(d) > addDays(iso, 10) ||
                          unavailable.includes(dateToWeekDay(new Date(d)))
                          ? "pointer-events-none opacity-35"
                          : "cursor-pointer",
                      )}
                    >
                      <DaysButtons
                        day={d}
                        selected={dateToString(selectedDate) === d}
                      />
                    </div>
                  ))}
                </div>
                {selectedDate && (
                  <p className="text-sm font-medium text-[#094577]">
                    {format(selectedDate, "EEEE، d MMMM yyyy", { locale: ar })}
                  </p>
                )}
              </div>

              {/* time slots */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[#094577]">
                  <span className="text-red-500">* </span>الوقت
                </p>
                <Controller
                  name="time"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <div className="space-y-2">
                      {loadingTimes ? (
                        <TimeSkeleton />
                      ) : !selectedDate ? (
                        <div className="flex items-start gap-3 p-4 border rounded-lg bg-blue-50 text-theme">
                          <CalendarIcon className="w-5 h-5 shrink-0" />
                          <p className="text-sm font-medium">
                            اختر التاريخ أولاً لعرض المواعيد المتاحة
                          </p>
                        </div>
                      ) : !times ||
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        Object.values(times).every((t: any) => !t?.length) ? (
                        <div className="flex items-start gap-3 p-4 border rounded-lg bg-red-50 text-red-700">
                          <Clock className="w-5 h-5 shrink-0" />
                          <p className="text-sm font-medium">
                            لا توجد مواعيد متاحة لهذا اليوم
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {Object.entries(times).map(
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            ([phase, phaseTimes]: [string, any]) => {
                              if (!phaseTimes?.length) return null;
                              const meta =
                                phaseMeta[phase as keyof typeof phaseMeta];
                              return (
                                <div key={phase} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <meta.Icon
                                        className={cn(meta.style, "w-4")}
                                      />
                                      <span className="text-sm text-gray-700 font-medium">
                                        {meta.label}
                                      </span>
                                    </div>
                                    <span className="text-xs text-gray-400">
                                      {meta.range}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    {phaseTimes.map((t: string) => {
                                      const option = timeByValue[t];
                                      return (
                                        <button
                                          key={t}
                                          type="button"
                                          onClick={() => field.onChange(t)}
                                          className={cn(
                                            "text-sm font-medium px-3 py-2 rounded-lg border transition-colors",
                                            selectedTime === t
                                              ? "bg-theme text-white border-theme"
                                              : "bg-gray-100 text-gray-800 hover:bg-theme hover:text-white",
                                          )}
                                        >
                                          {option.label}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            },
                          )}
                        </div>
                      )}
                      {fieldState.invalid && (
                        <p className="text-xs text-red-500">
                          {fieldState.error?.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </div>

              {/* footer: cost + next */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleNext}
                  size="sm"
                >
                  الخطوة التالية
                  <ChevronLeft className="w-4 h-4 ms-1" />
                </Button>
                <div className="text-center">
                  <CurrencyLabel
                    amount={cost}
                    tax={15}
                    textStyle="text-theme font-semibold"
                  />
                  <p className="text-xs text-gray-500 mt-0.5">
                    جلسة 60 دقيقة + تطبيق المقياس
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-6">
              {/* selected summary */}
              {selectedDate && selectedTime && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-theme text-sm font-medium">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span>
                    {format(selectedDate, "EEEE، d MMMM", { locale: ar })} —{" "}
                    {timeByValue[selectedTime]?.label}
                    {selectedGender && (
                      <span className="mr-2 text-gray-500">
                        (
                        {selectedGender === Gender.MALE
                          ? "مقياس الذكور"
                          : "مقياس الإناث"}
                        )
                      </span>
                    )}
                  </span>
                </div>
              )}

              <FieldGroup>
                {/* name */}
                <Controller
                  name="name"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        <span className="text-red-700 font-medium">* </span>
                        الاسم
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        placeholder="اكتب اسمك"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />

                {/* phone */}
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        <span className="text-red-700 font-medium">* </span>رقم
                        الهاتف
                      </FieldLabel>
                      <div dir="ltr">
                        <PhoneInput
                          {...field}
                          id={field.name}
                          placeholder="50000000"
                        />
                      </div>
                      <div className="inline-flex items-center gap-1.5 mt-1">
                        <CircleAlert className="w-4 text-gray-500" />
                        <p className="text-xs text-gray-500">
                          يجب أن يكون مربوطاً بالواتساب
                        </p>
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>

              {/* cost summary */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-200">
                <div>
                  <p className="text-sm text-gray-500">المجموع شامل الضريبة</p>
                  <CurrencyLabel
                    amount={cost}
                    tax={15}
                    textStyle="text-xl font-bold text-[#094577]"
                  />
                </div>
                <div className="text-xs text-gray-400 text-left">
                  <p>جلسة 60 دقيقة</p>
                  <p>+ تطبيق المقياس</p>
                </div>
              </div>

              {/* nav */}
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  type="button"
                  onClick={handleBack}
                  size="sm"
                >
                  <ChevronRight className="w-4 h-4 me-1" />
                  السابق
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleNext}
                  size="sm"
                >
                  الخطوة التالية
                  <ChevronLeft className="w-4 h-4 ms-1" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && <StepPayment form={form} onBack={handleBack} />}
        </form>
      </div>
    </div>
  );
}

function TimeSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-9 w-full rounded-lg bg-gray-200 animate-pulse"
        />
      ))}
    </div>
  );
}
