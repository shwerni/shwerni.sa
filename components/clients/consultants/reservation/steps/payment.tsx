// React & Next
import Image from "next/image";

// packages
import { UseFormReturn } from "react-hook-form";

// components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import CouponForm from "@/components/clients/consultants/reservation/forms/coupons";
import MethodForm from "@/components/clients/consultants/reservation/forms/method";
import TermsForm from "@/components/clients/consultants/reservation/forms/terms";

// schema
import { ReservationFormType } from "@/schemas";

// utils
import { dateLabel, timeLabel } from "@/utils/date";

// hooks
import { usePaymentCalculation } from "@/hooks/site/usePaymentCalculation";

// types
import { Cost } from "@/types/data";

// icons
import { FaUserDoctor } from "react-icons/fa6";
import { User, Clock, Calendar, ChevronRight } from "lucide-react";

// props
interface Props {
  onBack: () => void;
  form: UseFormReturn<ReservationFormType>;
}

export default function StepPayment({ form, onBack }: Props) {
  const {
    formState: { isSubmitting, isLoading },
  } = form;

  // consultant
  const consultant = form.getValues("consultant");

  // form data
  const { cost, finance } = form.getValues();

  // initial cost
  const initialCost = cost[form.getValues("duration") as keyof Cost];

  // summary
  const summary = [
    {
      label: form.getValues("name"),
      icon: User,
    },
    {
      label: "الاستشاري " + consultant,
      icon: FaUserDoctor,
    },
    {
      label: dateLabel(form.getValues("date")),
      icon: Calendar,
    },
    {
      label:
        timeLabel(form.getValues("time")) +
        " , " +
        form.getValues("duration") +
        "دقيقة",
      icon: Clock,
    },
  ];

  // coupons
  const { couponCode, couponPercent } = form.watch();

  // payment calculation hook
  const payment = usePaymentCalculation({
    baseCost: initialCost,
    tax: finance.tax,
    initialDiscount: couponPercent,
    wallet: null, // pass wallet // later when ready
  });

  // payment summary
  const paymentSummary = [
    {
      label: "الاجمالي غير شامل الضريبة",
      value: initialCost.toFixed(2) + " ⃁",
    },
    {
      label: "الاجمالي شامل الضريبة",
      value: payment.subTotal.toFixed(2) + " ⃁",
    },
    {
      label: "كود الخصم",
      value: couponPercent && couponCode,
    },
    {
      label: "نسبة الخصم",
      value: couponPercent && couponPercent + " %",
    },
  ];

  return (
    <div className="space-y-6">
      {/* payment info */}
      <div className="mx-auto border py-4 px-2 sm:px-3 rounded-md space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">
          بيانات الاستشارة
        </h3>
        {/* order summary */}
        <div className="grid grid-cols-2 gap-x-3 gap-y-4">
          {summary.map((i, index) => (
            <div key={index} className="inline-flex items-center gap-2">
              <i.icon className="w-6 text-xl text-theme" />
              <h6 className="text-[#1F2A37] text-xs font-medium">{i.label}</h6>
            </div>
          ))}
        </div>
        {/* notifications */}
        <div className="flex items-center gap-3">
          <Image
            src="/svg/whatsapp-btn.svg"
            alt="whatsapp"
            width={35}
            height={35}
          />
          <div className="flex flex-col gap-2">
            <h5 className="font-medium text-gray-700 text-sm">
              اشعار تأكيد الحجز على وتساب
            </h5>
            <h5 className="font-medium text-gray-700 text-sm">
              {form.getValues("phone")}{" "}
              {form.getValues("hasBeneficiary") &&
                ` | ${form.getValues("beneficiaryPhone")}`}
            </h5>
          </div>
        </div>
      </div>
      {/* cost info */}
      <div className="border py-4 px-2 sm:px-3 rounded-md mx-auto space-y-6">
        <h3 className="text-lg font-semibold text-gray-800">معلومات الدفع</h3>
        {/* payment summary & payment methods */}
        <div className="flex flex-col-reverse items-start gap-y-5 md:grid md:grid-cols-5">
          {/* payment methods */}
          <div className="col-span-3 space-y-5 w-full">
            <h4 className="text-sm text-gray-700">خيارات الدفع المتاحة</h4>
            {/* methods */}
            <MethodForm form={form} />
            {/* coupon */}
            {finance.couponEnabled && payment.total > 0 ? (
              <CouponForm form={form} />
            ) : null}
            {/* terms */}
            <TermsForm form={form} />
          </div>
          {/* payment summary */}
          <div className="md:col-span-2 w-[95%] max-w-96 bg-[#F1F8FE] pt-5 pb-14 px-3 sm:px-5 space-y-8 mx-auto rounded-lg">
            <h4 className="text-center text-lg font-medium text-gray-700">
              الفاتورة
            </h4>
            <div className="flex flex-col justify-center items-center gap-2 max-w-11/12 mx-auto">
              {paymentSummary.map(
                (i, index) =>
                  i.value && (
                    <div
                      key={index}
                      className="flex justify-between items-center w-full"
                    >
                      <h6 className="text-sm text-gray-700">{i.label}</h6>
                      <h6 className="text-sm text-gray-700 font-semibold">
                        {i.value}
                      </h6>
                    </div>
                  ),
              )}
              <Separator className="w-10/12 mt-4 mb-2 mx-auto" />
              <div className="flex justify-between items-center w-full">
                <h6 className="text-sm text-gray-700">الإجمالي</h6>
                <h6 className="text-sm text-gray-700 font-semibold">
                  {payment.totalWTax.toFixed(2)} ⃁
                </h6>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* navigation */}
      <div className="flex items-center justify-center md:justify-start gap-5">
        <Button variant="ghost" type="button" onClick={onBack} size="sm">
          <ChevronRight />
          الخطوة السابقة
        </Button>
        <Button
          variant="primary"
          type="submit"
          size="sm"
          className="px-6"
          loading={isSubmitting || isLoading}
        >
          ادفـع الآن
        </Button>
      </div>
    </div>
  );
}
