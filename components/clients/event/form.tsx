"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// schema
import { freeSessionSchema, freeSessionSchemaType } from "@/schemas";

// components
import { toast } from "@/components/shared/toast";
import { Stepper } from "@/components/clients/freesessions/reservation/stepper";
import StepDetails from "@/components/clients/freesessions/reservation/steps/details";
import StepDateTime from "@/components/clients/freesessions/reservation/steps/date-time";

// utils
import { phoneNumber } from "@/utils";

// lib
import { timeZone } from "@/lib/site/time";

// handlers
import { runRecaptcha } from "@/handlers/admin/recaptcha";
import {
  confirmEventFreeSession,
  confirmFreeSession,
} from "@/handlers/admin/freesession";

// types
import { User } from "next-auth";

// props
interface Props {
  cid: number;
  user?: User;
  consultant: string;
  event?: boolean;
}

export default function ReservationForm({
  cid,
  user,
  consultant,
  event = false,
}: Props) {
  // steps labels
  const steps = ["التاريخ والوقت", "بيانات الاستشارة"];

  // steps
  const [step, setStep] = React.useState(0);

  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // time
  const { iso } = timeZone();

  // form
  const form = useForm<freeSessionSchemaType>({
    resolver: zodResolver(freeSessionSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "temp",
      order: "consultant",
      cid,
      date: iso,
      consultant,
      // form
      name: "",
      phone: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  // validation steps
  const stepFields: Record<number, (keyof freeSessionSchemaType)[]> = {
    0: ["time"],
    1: ["name", "phone", "acceptTerms"],
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
      toast.info({
        title: steps[step],
        message: "الرجاء ملء الحقول المطلوبة بشكل صحيح",
      });
      return;
    }

    // update step
    setStep(number);

    // scroll to top of #reserve
    const reserveDiv = document.getElementById("reserve");
    reserveDiv?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  async function onSubmit(data: freeSessionSchemaType) {
    // recaptcha
    const token = await runRecaptcha(executeRecaptcha);

    // validate
    if (!token) return;

    // validate phones
    data.phone = phoneNumber(data.phone);

    // normal free session
    if (!event) {
      await confirmFreeSession(data);
      return;
    }

    // national day — success redirects, failure returns a reason
    const result = await confirmEventFreeSession(data);

    if (result?.state === false) {
      toast.info({ title: "حجز اليوم الوطني", message: result.message });

      // slot lost to someone else → back to time selection
      if (result.step === "EVENT_SLOT_TAKEN") setStep(0);
    }
  }

  return (
    <div className="w-11/12 p-5 mx-4 bg-[#F9FAFB] border border-[#E5E7EB]">
      <Stepper step={step} steps={steps} />

      <div className="py-10 px-3 sm:px-6 rounded-lg">
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* date & time */}
          {step === 0 && (
            <StepDateTime
              form={form}
              onNext={() => handleNext(1)}
              backHref="/event"
            />
          )}

          {/* reserver info */}
          {step === 1 && (
            <StepDetails form={form} onBack={() => handleNext(0)} />
          )}
        </form>
      </div>
    </div>
  );
}
