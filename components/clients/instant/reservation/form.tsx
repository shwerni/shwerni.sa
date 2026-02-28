"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import { toast } from "@/components/shared/toast";
import StepPayment from "@/components/clients/instant/reservation/steps/payment";
import StepDetails from "@/components/clients/instant/reservation/steps/details";

// utils
import { phoneNumber } from "@/utils";
import { calculatePayment } from "@/utils/admin/payments";

// handlers
import { Pay } from "@/handlers/admin/order/payment";
import { runRecaptcha } from "@/handlers/admin/recaptcha";

// utils
import { add25Minutes, addNMinutes } from "@/utils/date";

// types
import { User } from "next-auth";
import { FinanceConfig } from "@/types/data";

// schema
import { InstantFormType, instantSchema } from "@/schemas/index";

// props
interface Props {
  user?: User;
  finance: FinanceConfig;
}

export default function InstantReservationForm({ user, finance }: Props) {
  // steps
  const [step, setStep] = React.useState(0);

  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  const { time, iso } = addNMinutes();
  
  // form
  const form = useForm<InstantFormType>({
    resolver: zodResolver(instantSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "temp",
      order: "instant",
      duration: 30,
      date: iso,
      time,
      finance,
      // form
      name: "",
      phone: "",
      notes: "",
      couponCode: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // validation steps
  const stepFields: Record<number, (keyof InstantFormType)[]> = {
    0: ["name", "phone"],
    1: ["couponCode", "method", "acceptTerms"],
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

  async function onSubmit(data: InstantFormType) {
    // recaptcha
    const token = await runRecaptcha(executeRecaptcha);

    // validate
    if (!token) return;

    // calculate total
    const payment = calculatePayment({
      baseCost: form.getValues("cost"),
      tax: finance.tax,
      discountPercent: data.couponPercent ?? 0,
    });

    // validate phones
    data.phone = phoneNumber(data.phone);

    // pay
    await Pay(data, payment.total, payment.totalWTax);
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit, (errors) => {
        console.error("Form validation failed:", errors);
        toast.error({
          message: "يوجد أخطاء في النموذج، يرجى المراجعة",
        });
      })}
    >
      {" "}
      {/* reserver info */}
      {step === 0 && <StepDetails form={form} onNext={() => handleNext(1)} />}
      {/* payment */}
      {step === 1 && <StepPayment form={form} onBack={() => handleNext(0)} />}
    </form>
  );
}
