"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import { toast } from "@/components/shared/toast";
import { Stepper } from "@/components/clients/freesessions/reservation/stepper";
import StepDetails from "@/components/clients/freesessions/reservation/steps/details";
import StepDateTime from "@/components/clients/freesessions/reservation/steps/date-time";

// utils
import { phoneNumber } from "@/utils";

// handlers
import { runRecaptcha } from "@/handlers/admin/recaptcha";

// types
import { User } from "next-auth";
import { freeSessionSchema, freeSessionSchemaType } from "@/schemas";
import { timeZone } from "@/lib/site/time";
import { add25Minutes } from "@/utils/date";
import { confirmFreeSession } from "@/handlers/admin/freesession";

// schema

// props
interface Props {
  cid: number;
  user?: User;
  consultant: string;
}

export default function ReservationForm({ cid, user, consultant }: Props) {
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
      date: add25Minutes(iso).iso,
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

  async function onSubmit(data: freeSessionSchemaType) {
    // recaptcha
    const token = await runRecaptcha(executeRecaptcha);

    // validate
    if (!token) return;

    // validate phones
    data.phone = phoneNumber(data.phone);

    // pay
    await confirmFreeSession(data);
  }

  return (
    <div className="bg-[#F1F8FE] px-4 sm:px-5">
      <div className="max-w-4xl mx-auto">
        <Stepper step={step} steps={steps} />

        <div className="bg-white py-10 px-3 sm:px-6 rounded-lg shadow">
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* date & time */}
            {step === 0 && (
              <StepDateTime form={form} onNext={() => handleNext(1)} />
            )}

            {/* reserver info */}
            {step === 1 && (
              <StepDetails form={form} onBack={() => handleNext(0)} />
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
