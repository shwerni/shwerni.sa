"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { toast } from "@/components/shared/toast";
import { Stepper } from "@/components/clients/programs/reservation/stepper";
import StepPayment from "@/components/clients/programs/reservation/steps/payment";
import StepDetails from "@/components/clients/programs/reservation/steps/details";
import StepDateTime from "@/components/clients/programs/reservation/steps/date-time";

// utils
import { phoneNumber } from "@/utils";
import { calculatePayment } from "@/utils/admin/payments";

// lib
import { Consultant } from "@/lib/generated/prisma/client";

// schema
import {
  ProgramReservationFormType,
  programReservationSchema,
} from "@/schemas/index";

// handlers
import { Pay } from "@/handlers/admin/order/payment";

// types
import { User } from "next-auth";
import { FinanceConfig } from "@/types/data";

// props
interface Props {
  user?: User;
  prid: number;
  sessions: number;
  cost: number;
  duration: number;
  finance: FinanceConfig;
  consultants: Pick<
    Consultant,
    "cid" | "category" | "name" | "image" | "rate" | "gender"
  >[];
}

export default function ReservationForm({
  prid,
  user,
  cost,
  sessions,
  finance,
  duration,
  consultants,
}: Props) {
  // steps labels
  const steps = ["البيانات العامة", "التاريخ والوقت", "التأكيد والدفع"];

  // steps
  const [step, setStep] = React.useState(0);

  // form
  const form = useForm<ProgramReservationFormType>({
    resolver: zodResolver(programReservationSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "temp",
      order: "program",
      cost,
      prid,
      sessions,
      finance,
      duration,
      // form
      name: "",
      phone: "",
      couponCode: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // validation steps
  const stepFields: Record<number, (keyof ProgramReservationFormType)[]> = {
    0: ["name", "phone", "cid"],
    1: ["date", "time"],
    2: ["couponCode", "method", "acceptTerms"],
  };

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

  async function onSubmit(data: ProgramReservationFormType) {
    // calculate total
    const payment = calculatePayment({
      baseCost: cost,
      tax: finance.tax,
      discountPercent: data.couponPercent ?? 0,
    });

    // validate phones
    data.phone = phoneNumber(data.phone);

    // pay
    await Pay(data, payment.total, payment.totalWTax);
  }

  return (
    <div className="max-w-4xl mx-auto px-5 py-6 border border-gray-200 rounded-md mb-5 space-y-5">
      <h3 className="text-base font-semibold">نموذج التسجيل بالبرنامج</h3>

      <Stepper step={step} steps={steps} />

      <div className="px-3 sm:px-6">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* reserver info */}
          {step === 0 && (
            <StepDetails
              form={form}
              onNext={() => handleNext(1)}
              consultants={consultants}
            />
          )}

          {/* date & time */}
          {step === 1 && (
            <StepDateTime
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
  );
}
