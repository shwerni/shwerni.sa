"use client";
// React & Next
import React from "react";

// packages
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import { toast } from "@/components/shared/toast";
import { Stepper } from "@/components/clients/consultants/reservation/stepper";
import StepPayment from "@/components/clients/consultants/reservation/steps/payment";
import StepDetails from "@/components/clients/consultants/reservation/steps/details";
import StepDateTime from "@/components/clients/consultants/reservation/steps/date-time";

// utils
import { phoneNumber } from "@/utils";
import { calculatePayment } from "@/utils/admin/payments";

// handlers
import { Pay } from "@/handlers/admin/order/payment";
import { runRecaptcha } from "@/handlers/admin/recaptcha";

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// types
import { User } from "next-auth";
import { Cost, FinanceConfig } from "@/types/data";

// schema
import { ReservationFormType, reservationSchema } from "@/schemas/index";

// icons
import { CalendarDays, CircleCheck } from "lucide-react";
import { Package } from "@/lib/generated/prisma/client";
import Packages from "./packages";

// props
interface Props {
  cid: number;
  unavailable: Weekday[];
  cost: Cost;
  finance: FinanceConfig;
  user?: User;
  consultant: string;
  packages: Package[];
  collaboration?: string;
}

export default function ReservationForm({
  cid,
  user,
  cost,
  finance,
  consultant,
  packages,
  unavailable,
  collaboration,
}: Props) {
  // steps labels
  const steps = ["التاريخ والوقت", "بيانات الاستشارة", "التأكيد والدفع"];

  // steps
  const [step, setStep] = React.useState(0);

  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // form
  const form = useForm<ReservationFormType>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "temp",
      order: "consultant",
      cid,
      consultant,
      collaboration,
      cost,
      finance,
      unavailable,
      // form
      name: "",
      phone: "",
      notes: "",
      duration: "30",
      hasBeneficiary: false,
      beneficiaryName: "",
      beneficiaryPhone: "",
      couponCode: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // validation steps
  const stepFields: Record<number, (keyof ReservationFormType)[]> = {
    0: ["date", "time"],
    1: [
      "name",
      "phone",
      "duration",
      "hasBeneficiary",
      "beneficiaryName",
      "beneficiaryPhone",
    ],
    2: ["couponCode", "method", "acceptTerms"],
  };

  const [selectedSessions, sessionType, selectedCost] = useWatch({
    control: form.control,
    name: ["sessions", "sessionType", "cost"],
  });
  const isPackageSelected = sessionType === "MULTIPLE";

  // handle next
  const handleNext = async (number: number) => {
    // if loading or sumbiting
    if (form.formState.isLoading || form.formState.isSubmitting) return;

    // fields
    const fields = stepFields[step];
    const isValid = await form.trigger(fields);

    // validate
    if (!isValid && number > step) {
      // error
      // const errorField = fields.find((field) => form.formState.errors[field]);
      // description:
      //   (errorField &&
      //     (form.formState.errors[errorField] as FieldError).message) ||
      //   "الرجاء ملء الحقول المطلوبة بشكل صحيح",

      // toast
      toast.info({
        title: steps[step],
        message: "الرجاء ملء الحقول المطلوبة بشكل صحيح",
      });

      // return
      return;
    }

    // update step
    setStep(number);

    // scroll to top of #reserve
    const reserveDiv = document.getElementById("reserve");
    reserveDiv?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // cancel handler
  const handleCancelPackage = () => {
    form.setValue("cost", cost);
    form.setValue("sessionType", "ONCE");
    form.setValue("sessions", 1);
  };

  async function onSubmit(data: ReservationFormType) {
    // recaptcha
    const token = await runRecaptcha(executeRecaptcha);

    // validate
    if (!token) return;

    // calculate total
    const payment = calculatePayment({
      baseCost: cost[data.duration as keyof Cost],
      tax: finance.tax,
      discountPercent: data.couponPercent ?? 0,
    });

    // validate phones
    data.phone = phoneNumber(data.phone);
    data.beneficiaryPhone =
      data.beneficiaryPhone && phoneNumber(data.beneficiaryPhone);

    // pay
    await Pay(data, payment.total, payment.totalWTax);
  }

  return (
    <div id="reserve" className="space-y-3">
      {/* Packages */}
      <Packages costs={cost} packages={packages} form={form} />
      {/* reserve section */}
      <div className="w-fit mx-auto flex items-center gap-2 px-5 py-1.5 rounded-full bg-[#F1F8FE] border border-blue-100">
        <CalendarDays className="text-theme w-5" />
        <h3 className="text-base font-semibold">الحجز</h3>
      </div>
      {/* main */}
      <div className="bg-[#F1F8FE] px-4 sm:px-5 pb-5">
        <div className="max-w-4xl mx-auto">
          <Stepper step={step} steps={steps} />

          {/* package selection banner */}
          {isPackageSelected && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-md border border-theme mb-3">
              <div className="inline-flex items-center gap-1.5">
                <CircleCheck className="size-4 text-green-400" />
                <p className="text-sm font-semibold text-[#094577]">
                  تم اختيار باقة {selectedSessions} جلسات
                </p>
              </div>
              <button
                type="button"
                onClick={handleCancelPackage}
                className="text-xs text-gray-600 hover:text-gray-700 underline whitespace-nowrap transition-colors"
              >
                إلغاء الباقة
              </button>
            </div>
          )}

          <div className="bg-white py-10 px-3 sm:px-6 rounded-lg shadow">
            <form onSubmit={form.handleSubmit(onSubmit)}>
              {/* date & time */}
              {step === 0 && (
                <StepDateTime form={form} onNext={() => handleNext(1)} />
              )}

              {/* reserver info */}
              {step === 1 && (
                <StepDetails
                  form={form}
                  onNext={() => handleNext(2)}
                  onBack={() => handleNext(0)}
                />
              )}

              {/* payment */}
              {step === 2 && (
                <StepPayment form={form} onBack={() => handleNext(1)} />
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
