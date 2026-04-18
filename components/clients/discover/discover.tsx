"use client";
// React & Next
import React from "react";

// packages
import { isSameDay } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import Header from "@/components/clients/header/header";
import Reels from "@/components/clients/discover/reels";
import TimeStep from "@/components/clients/discover/time";
import DateStep from "@/components/clients/discover/date";
import StepPayment from "@/components/clients/forms/payment";
import StepDetails from "@/components/clients/forms/details";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { add25Minutes, getDatesAhead } from "@/utils/date";

// prisma data
import { getAvailableTimesForDate } from "@/data/reels";

// prisma types
import { Categories, Gender, OrderType } from "@/lib/generated/prisma/enums";

// schemas
import { ReservationFormType, reservationSchema } from "@/schemas";

// types
import { Cost, FinanceConfig } from "@/types/data";
import { User } from "next-auth";
import { calculatePayment } from "@/utils/admin/payments";
import { runRecaptcha } from "@/handlers/admin/recaptcha";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
import { phoneNumber } from "@/utils";
import { Pay } from "@/handlers/admin/order/payment";

type Step = "date" | "time" | "reel" | "info" | "payment";

// props
interface Props {
  finance: FinanceConfig;
  user?: User;
}
type ReelConsultant = {
  cid: number;
  name: string;
  title: string;
  nabout: string;
  gender: Gender;
  category: Categories;
  image: string | null;
  rate: number;
  cost30: number;
  cost45: number;
  cost60: number;
  years: number;
  review_count: number;
};

export default function Discover({ user, finance }: Props) {
  // time zone & dates
  const { iso: initial } = timeZone();
  const { date: iso, time: nowTime } = React.useMemo(
    () => add25Minutes(initial),
    [initial],
  );

  const days = getDatesAhead(6, initial);

  // states for UI steps & filters
  const [step, setStep] = React.useState<Step>("date");
  const [selectedGender, setSelectedGender] = React.useState<Gender | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] =
    React.useState<Categories | null>(null);
  const [flatTimes, setFlatTimes] = React.useState<string[]>([]);
  const [loadingTimes, setLoadingTimes] = React.useState(false);

  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // Form initialization
  const form = useForm<ReservationFormType>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      // ui/ux data
      user: user?.id || "",
      order: "consultant",
      finance,
      type: OrderType.SCHEDULED,
      time: "",
      cost: {
        30: 0,
        60: 0,
      },
      // form basic info
      name: "",
      phone: "",
      notes: "",
      duration: "30",
      hasBeneficiary: false,
      beneficiaryName: "",
      beneficiaryPhone: "",
      // step 3 / payment info
      couponCode: "",
      hasCoupon: false,
    },
    mode: "onChange",
  });

  // watch values directly from the form instead of using useState
  const selectedDate = form.watch("date");
  const selectedTime = form.watch("time");
  const cost = form.watch("cost");

  // handle date select
  async function handleDateSelect(dateStr: string) {
    const date = new Date(dateStr);

    // set date and reset time in the form
    form.setValue("date", date, { shouldValidate: true });
    form.setValue("time", "", { shouldValidate: true });

    setFlatTimes([]);
    setLoadingTimes(true);
    setStep("time");

    try {
      const minTime = isSameDay(date, iso) ? nowTime : undefined;
      const times = await getAvailableTimesForDate(dateStr, minTime);
      setFlatTimes(times);
    } finally {
      setLoadingTimes(false);
    }
  }

  // handle time select
  function handleTimeSelect(time: string) {
    form.setValue("time", time, { shouldValidate: true });
    setStep("reel");
  }

  // form sumbit
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
    <div className="flex flex-col h-full overflow-hidden bg-gray-50">
      <div className="relative flex-1 overflow-hidden">
        {/* step 1: Date */}
        <StepView active={step === "date"}>
          <Header />
          <DateStep
            days={days}
            iso={iso}
            onSelect={handleDateSelect}
            gender={selectedGender}
            setGender={setSelectedGender}
            category={selectedCategory}
            setCategory={setSelectedCategory}
          />
        </StepView>

        {/* step 2: Time */}
        <StepView active={step === "time"}>
          <Header />
          {selectedDate && (
            <TimeStep
              selectedDate={selectedDate}
              times={flatTimes}
              loading={loadingTimes}
              onBack={() => setStep("date")}
              onSelect={handleTimeSelect}
            />
          )}
        </StepView>

        {/* step 3: Reel */}
        <StepView active={step === "reel"}>
          {selectedDate && selectedTime && (
            <Reels
              selectedDate={selectedDate}
              selectedTime={selectedTime}
              selectedGender={selectedGender}
              selectedCategory={selectedCategory}
              onBack={() => setStep("time")}
              onNext={(selectedConsultant: ReelConsultant) => {
                form.setValue("cost", {
                  "30": selectedConsultant.cost30,
                  "60": selectedConsultant.cost60,
                });

                form.setValue("cid", selectedConsultant.cid);

                setStep("info");
              }}
            />
          )}
        </StepView>

        {/* step 4: Info / Details */}
        <StepView active={step === "info"}>
          <Header />
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {selectedDate && selectedTime && (
              <StepDetails
                form={form}
                onNext={async () => {
                  const isStepValid = await form.trigger([
                    "name",
                    "phone",
                    "duration",
                  ]);
                  if (isStepValid) setStep("payment");
                }}
                onBack={() => setStep("reel")}
              />
            )}
          </div>
        </StepView>

        {/* step 5: Payment */}
        <StepView active={step === "payment"}>
          <Header />
          <div className="flex-1 overflow-y-auto px-5 py-6">
            {selectedDate && selectedTime && (
              <StepPayment onBack={() => setStep("info")} form={form} />
            )}
          </div>
        </StepView>
      </div>
    </div>
  );
}

function StepView({
  active,
  children,
}: {
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className="absolute inset-0 flex flex-col transition-all duration-300"
      style={{
        opacity: active ? 1 : 0,
        transform: active ? "translateX(0)" : "translateX(40px)",
        pointerEvents: active ? "auto" : "none",
        visibility: active ? "visible" : "hidden",
        zIndex: active ? 10 : 0,
      }}
    >
      {children}
    </div>
  );
}
