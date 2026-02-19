"use client";
// React & Next
import React from "react";
import Image from "next/image";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import { Form } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ZToast } from "@/app/_components/layout/toasts";
import { Section } from "@/app/_components/layout/section";
import ReservationForm from "@/components/clients/instant/form";
import ConsultantTimings from "@/app/_components/layout/consultant/timings";
import ReservationConfirm from "@/components/clients/instant/confirmation";

// auth types
import { User } from "next-auth";

// schema
import { Reservation } from "@/schemas";

// lib
import { verifyRecaptcha } from "@/lib/api/recaptcha";

// utils
import { meetingLabel } from "@/utils/moment";

// prisma types
import { OrderType } from "@/lib/generated/prisma/enums";

// icons
import { Sparkles } from "lucide-react";

// props
interface Props {
  user: User | undefined;
}

// return
export default function OfficialConsultant({ user }: Props) {
  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // time selection
  const [time, setTime] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);

  // default input with validation onChange
  const form = useForm<z.infer<typeof Reservation>>({
    resolver: zodResolver(Reservation),
    mode: "onChange",
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      description: "",
    },
  });

  // handle reservation logic
  const onSubmit = async (values: z.infer<typeof Reservation>) => {
    if (!time || !date) {
      ZToast({
        state: false,
        message: "الرجاء اختيار الوقت والتاريخ قبل الحجز ⏰",
      });
      return false;
    }
  };

  const handleReserve = async (
    values: z.infer<typeof Reservation>
  ): Promise<boolean> => {
    if (!time || !date) {
      ZToast({
        state: false,
        message: "الرجاء اختيار الوقت والتاريخ قبل الحجز ⏰",
      });
      return false;
    }

    if (!executeRecaptcha) {
      ZToast({
        state: false,
        message:
          "حدثت مشكلة أثناء التحقق من الأمان، حاول مرة ثانية أو تواصل مع الدعم.",
      });
      return false;
    }

    const token = await executeRecaptcha();
    const verified = await verifyRecaptcha(token);
    if (!verified) {
      ZToast({
        state: false,
        message:
          "حدثت مشكلة أثناء التحقق من الأمان، حاول مرة ثانية أو تواصل مع الدعم.",
      });
      return false;
    }

    // const reserve = await confirmReservation(
    //   user?.id,
    //   form.getValues("name"),
    //   form.getValues("phone"),
    //   form.getValues("description"),
    //   36,
    //   date,
    //   time,
    //   "30",
    //   60,
    //   OrderType.INSTANT,
    //   false,
    //   undefined,
    //   undefined,
    //   undefined
    // );

    // if (reserve?.state === false) {
    //   ZToast({
    //     state: false,
    //     message: reserve?.message || "حدث خطأ أثناء الحجز ❌",
    //   });
    //   return false;
    // }

    // ZToast({
    //   state: true,
    //   message: "تم حجز جلستك بنجاح ✅",
    // });

    return true;
  };

  // return
  return (
    <Section className="flex flex-col items-center justify-center max-w-3xl mx-auto space-y-6 py-10 text-center">
      <div className="bg-gradient-to-r from-zblue-200 via-blue-500 to-blue-200 text-white rounded-2xl shadow-lg p-5 w-full max-w-2xl animate-fade-in">
        <Badge className="mb-2 bg-white text-red-600 font-bold text-sm">
          لفترة محدودة 🔥
        </Badge>
        <h2 className="text-2xl text-blue-900 sm:text-3xl font-extrabold mb-3">
          💥 عرض اليوم بـ <span className="text-yellow-300">69 ريال</span> فقط{" "}
          شامل الضريبة!
        </h2>
        <p className="text-white/90 text-lg">
          لا تفوّت الفرصة واستشر مختصّك المفضل بكل راحة من بيتك 🏡
        </p>
      </div>

      <div className="inline-flex items-center gap-2">
        <h3 className="font-bold">
          مع مستشار <span className="text-zblue-200">شاورني</span> المعتمد
        </h3>
        <Image src="/layout/metaTilte.png" alt="logo" width={25} height={25} />
      </div>

      {/* form */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-4"
        >
          {/* name & phone */}
          <ReservationForm form={form} />

          {/* timings */}
          <ConsultantTimings
            cid={36}
            time={time}
            title={`اختيار الموعد المناسب لك`}
            setTime={setTime}
            setDate={setDate}
            daysAhead={2}
          />
          {/* reservation confirm */}
          <ReservationConfirm
            lock={form.formState.isValid && !!time && !!date}
            owner={"مستشار شاورني"}
            description={
              "احجز العرض مع مستشار شاورني بقيمة 69 ريال شاملة الضريبة"
            }
            cid={36}
            label={meetingLabel(time ?? "", date ?? "")}
            total={60}
            duration="30"
            onConfirm={async () => await handleReserve(form.getValues())}
          >
            <Button type="submit" className="bg-zblue-200 px-5 gap-3">
              احجز العرض الان
              <Sparkles />
            </Button>
          </ReservationConfirm>
        </form>
      </Form>
    </Section>
  );
}
