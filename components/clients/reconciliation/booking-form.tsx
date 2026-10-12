"use client";
// React & Next
import { useState } from "react";

// packages
import { ar } from "date-fns/locale";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

// components
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneInput from "@/components/shared/phone-input";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import MethodForm from "@/components/clients/consultants/reservation/forms/method";
import StepDateTime from "@/components/clients/consultants/reservation/steps/date-time";
import { Stepper } from "@/components/clients/consultants/reservation/stepper";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { checkoutReconciliation } from "@/actions/reconciliation";

// prisma types
import { Gender, Relation, Weekday } from "@/lib/generated/prisma/enums";

// schemas
import type { ReservationFormType } from "@/schemas";

// types
import type { FinanceConfig } from "@/types/data";

// utils
import { timeOptions } from "@/utils";
import { TAX_PERCENT, withTax } from "@/utils/tax";
import {
  RECONCILIATION_DESCRIPTION_MAX,
  RECONCILIATION_DURATION,
  reconciliationCheckoutSchema,
  reconciliationErrors,
} from "@/utils/reconciliation";

// icons
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info,
  Loader2,
  Shield,
  User as UserIcon,
  Users,
} from "lucide-react";

// the two parties' details: the checkout schema's own rules (phones normalized, 500 max)
const detailsSchema = reconciliationCheckoutSchema.pick({
  name: true,
  phone: true,
  description: true,
  otherName: true,
  otherPhone: true,
  relation: true,
  gender: true,
});

type DetailsValues = {
  name: string;
  phone: string;
  description: string;
  otherName: string;
  otherPhone: string;
  relation: Relation;
  gender: Gender;
};

const steps = ["التاريخ والوقت", "بيانات الطرفين", "التأكيد والدفع"];

// the reconciliation booking: the booking flow's own date-time step and payment method form (no
// coupons) on a form of the booking form's type, so they're reused unchanged; the two parties'
// details; the بيننا terms. the price and the 60 minute duration only feed the labels: the action
// sends the client's choices only, and the server prices the order from the finance settings
export function ReconciliationBookingForm({
  cid,
  consultant,
  price,
  finance,
  unavailable,
}: {
  cid: number;
  consultant: string;
  price: number;
  finance: FinanceConfig;
  unavailable: Weekday[];
}) {
  const [step, setStep] = useState(0);

  // date, time, method and terms (the shared booking pieces)
  const booking = useForm<ReservationFormType>({
    defaultValues: {
      order: "reconciliation",
      user: "temp",
      cid,
      consultant,
      cost: { 30: price, 45: price, 60: price },
      finance: { ...finance, couponEnabled: false },
      unavailable,
      duration: RECONCILIATION_DURATION,
      name: "",
      phone: "",
      notes: "",
      hasBeneficiary: false,
      package: null,
    },
    shouldUnregister: false,
  });

  // the two parties
  const details = useForm<DetailsValues>({
    resolver: zodResolver(detailsSchema) as never,
    reValidateMode: "onChange",
    defaultValues: {
      name: "",
      phone: "",
      description: "",
      otherName: "",
      otherPhone: "",
      relation: undefined,
      gender: undefined,
    },
  });

  const [date, time] = useWatch({
    control: booking.control,
    name: ["date", "time"],
  });
  const timeLabel = timeOptions.find((t) => t.value === time)?.label;

  const { execute, isPending } = useAction(checkoutReconciliation, {
    errors: reconciliationErrors,
    loading: "جاري تحويلك إلى صفحة الدفع...",
  });

  // step 1 → 2: a date and a time
  const toDetails = () => {
    booking.clearErrors();
    if (!booking.getValues("date"))
      return booking.setError("date", { message: "التاريخ مطلوب" });
    if (!booking.getValues("time"))
      return booking.setError("time", { message: "اختر وقت الجلسة" });
    setStep(1);
  };

  // step 3: the full checkout schema, the same one the action checks
  const submit = () => {
    const b = booking.getValues();
    const parsed = reconciliationCheckoutSchema.safeParse({
      ...details.getValues(),
      date: b.date,
      time: b.time,
      method: b.method,
      acceptTerms: b.acceptTerms,
    });
    booking.clearErrors();
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "method" || key === "acceptTerms")
          booking.setError(key, { message: issue.message });
      }
      return;
    }
    execute(parsed.data);
  };

  const bookingErrors = booking.formState.errors;
  const total = withTax(price);

  return (
    <div className="space-y-6" dir="rtl">
      <Stepper step={step} steps={steps} />

      {/* step 1: the session date and time */}
      {step === 0 && (
        <div className="space-y-2">
          <StepDateTime form={booking} onNext={toDetails} />
          {(bookingErrors.date || bookingErrors.time) && (
            <p className="text-xs text-red-600">
              {bookingErrors.date?.message ?? bookingErrors.time?.message}
            </p>
          )}
        </div>
      )}

      {/* step 2: the two parties */}
      {step === 1 && (
        <Form {...details}>
          <form
            onSubmit={details.handleSubmit(() => setStep(2))}
            className="space-y-10"
          >
            {/* client data */}
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <UserIcon className="w-5 h-5 text-theme" />
                <h3 className="text-lg font-bold text-gray-800">
                  بيانات العميل
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={details.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        الاسم
                      </FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="off"
                          placeholder="أدخل اسمك الكريم"
                          className="bg-gray-50 border-gray-200 focus-visible:ring-theme/20 focus-visible:border-theme"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={details.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        رقم الهاتف
                      </FormLabel>
                      <FormControl>
                        <div dir="ltr">
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                          <FormDescription className="mt-1.5 text-right text-xs text-gray-400">
                            يرجى إدخال رقم هاتف مربوط بالواتساب
                          </FormDescription>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={details.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-semibold">
                      تفاصيل الخلاف{" "}
                      <span className="text-gray-400 font-normal text-xs">
                        (اختياري)
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="تحدث باختصار عن طبيعة الخلاف لمساعدة المستشار على فهم الحالة..."
                        className="resize-none h-28 bg-gray-50 border-gray-200 focus-visible:ring-theme/20 focus-visible:border-theme"
                        maxLength={RECONCILIATION_DESCRIPTION_MAX}
                        {...field}
                        dir="rtl"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* other party data */}
            <div className="bg-slate-50 rounded-2xl p-6 sm:p-8 border border-slate-100 space-y-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-theme/10 p-2 rounded-lg">
                  <Users className="w-5 h-5 text-theme" />
                </div>
                <h4 className="font-bold text-lg text-gray-800">
                  بيانات الطرف الآخر
                </h4>
              </div>

              <div className="flex items-start gap-2 text-sm text-gray-500 mb-6 bg-white p-3 rounded-lg border border-gray-100">
                <Info className="w-4 h-4 text-theme shrink-0 mt-0.5" />
                <p>
                  نحتاج هذه البيانات للتواصل مع الطرف الآخر ودعوته لجلسة الصلح
                  بكل مهنية وسرية.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={details.control}
                  name="otherName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        اسم الطرف الآخر
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="أدخل اسم الطرف الآخر"
                          className="bg-white border-gray-200"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={details.control}
                  name="otherPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        رقم هاتف الطرف الآخر
                      </FormLabel>
                      <FormControl>
                        <div dir="ltr">
                          <PhoneInput
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={details.control}
                  name="relation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        طبيعة العلاقة
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue placeholder="اختر العلاقة التي تربطكم" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Relation.SPOUSE}>زوج / زوجة</SelectItem>
                          <SelectItem value={Relation.PARENT}>أب / أم</SelectItem>
                          <SelectItem value={Relation.SIBLING}>أخ / أخت</SelectItem>
                          <SelectItem value={Relation.CHILD}>ابن / ابنة</SelectItem>
                          <SelectItem value={Relation.RELATIVE}>قريب آخر</SelectItem>
                          <SelectItem value={Relation.FRIEND}>صديق / صديقة</SelectItem>
                          <SelectItem value={Relation.COLLEAGUE}>زميل عمل</SelectItem>
                          <SelectItem value={Relation.OTHER}>علاقة أخرى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={details.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-semibold">
                        جنس الطرف الآخر
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-white border-gray-200">
                            <SelectValue placeholder="حدد الجنس" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Gender.MALE}>ذكر</SelectItem>
                          <SelectItem value={Gender.FEMALE}>أنثى</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setStep(0)}
              >
                <ChevronRight className="w-4 h-4" />
                الموعد
              </Button>
              <Button type="submit" variant="primary" size="sm">
                الخطوة التالية
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </Form>
      )}

      {/* step 3: summary, payment method and terms */}
      {step === 2 && (
        <div className="space-y-6">
          <dl className="text-sm space-y-2 rounded-lg bg-slate-50 border border-slate-100 px-4 py-3">
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
              <dd className="tabular-nums">{total} ريال</dd>
            </div>
          </dl>

          <MethodForm form={booking} />

          {/* the بيننا terms */}
          <Controller
            name="acceptTerms"
            control={booking.control}
            render={({ field, fieldState }) => (
              <div className="flex flex-row items-start gap-3" dir="rtl">
                <Checkbox
                  id="reconciliation-terms"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="mt-1 data-[state=checked]:bg-theme data-[state=checked]:border-theme"
                />
                <div className="space-y-1.5 leading-none">
                  <label
                    htmlFor="reconciliation-terms"
                    className="text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    اطلعت على{" "}
                    <Dialog>
                      <DialogTrigger className="text-theme font-bold hover:underline transition-all">
                        الشروط والأحكام
                      </DialogTrigger>
                      <DialogContent
                        dir="rtl"
                        className="w-[95%] max-w-2xl rounded-2xl"
                      >
                        <div className="p-2 space-y-4 text-gray-700">
                          <h3 className="text-lg font-bold text-theme mb-4 border-b pb-2">
                            شروط وأحكام خدمة بيننا
                          </h3>
                          <ul className="space-y-4 list-disc list-inside leading-relaxed marker:text-theme">
                            <li>
                              خدمة (بيننا) تُعدّ جلسة استشارية مكتملة الأركان
                              بمجرد انعقادها في الموعد المحدد، سواءً بحضور
                              الطرفين أو بحضور أحدهما فقط.
                            </li>
                            <li>
                              في حال تخلّف الطرف الآخر عن الحضور، أو حضور
                              الطرفين دون التوصل إلى اتفاق، لا يحق المطالبة
                              باسترجاع المبالغ المدفوعة، ويُعد ذلك قبولًا لطبيعة
                              الخدمة.
                            </li>
                          </ul>
                        </div>
                      </DialogContent>
                    </Dialog>{" "}
                    وأوافق عليها التزاماً كاملاً.
                  </label>
                  {fieldState.error && (
                    <p className="text-xs text-red-600">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              </div>
            )}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={() => setStep(1)}
              >
                <ChevronRight className="w-4 h-4" />
                البيانات
              </Button>
              <Button
                type="button"
                disabled={isPending}
                onClick={submit}
                className="h-11 bg-theme hover:bg-theme/90 text-white font-semibold rounded-xl"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                احجز جلسة المصالحة ({total} ريال)
              </Button>
            </div>
            <p className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
              <Shield className="w-4 h-4 text-emerald-500" />
              بياناتكم مشفرة وتُعامل بسرية تامة
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
