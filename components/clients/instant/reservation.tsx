"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import { Button } from "@/components/ui/button";
import ReservationConfirm from "@/components/clients/instant/confirmation";

// auth types

// schema
import { ReservationFormType, reservationSchema } from "@/schemas";

// lib
import { verifyRecaptcha } from "@/lib/api/recaptcha";

// utils
import { meetingLabel } from "@/utils/moment";

// handlers

// prisma types
import { Consultant, Instant } from "@/lib/generated/prisma/client";

// icons
import { CircleAlert, Clock2 } from "lucide-react";
import LoadingAnimation from "./skeleton";
import { toast } from "@/components/shared/toast";
import ConsultantCard from "./card";
import { User } from "next-auth";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import PhoneInput from "@/components/shared/phone-input";
import { Textarea } from "@/components/ui/textarea";

// props
interface Props {
  data:
    | { owner: Consultant; instant: Instant | undefined }[]
    | undefined
    | null;
  user?: User;
  time: string;
  date: string;
}

// return
export default function ReservationInstant({ data, user, date, time }: Props) {
  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // default input
  const form = useForm<ReservationFormType>({
    resolver: zodResolver(reservationSchema),
    defaultValues: {
      // password
      name: user?.name ? user.name : "",
      // phone
      phone: user?.phone ? `+${user.phone}` : "",
      // description
      notes: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // reserve
  async function requestReserve(cid: number, total: number) {
    // reCaptcha-v3 handler
    if (!executeRecaptcha) {
      toast.info({
        message:
          "حدثت مشكلة اثناء التحقق من الامان, برجاء المحاولة لاحقا او تواصل مع الدعم",
      });
      return null;
    }
    await executeRecaptcha().then((token) => {
      verifyRecaptcha(token).then((state) => {
        // return
        if (!state) {
          // if suspicious robot
          toast.info({
            message:
              "حدثت مشكلة اثناء التحقق من الامان, برجاء المحاولة لاحقا او تواصل مع الدعم",
          });
          return null;
        }
        // handle register fields submited data
        Reserve(cid, total);
        // if success
        return true;
      });
    });
    // if success
    return true;
  }

  // reserve
  async function Reserve(cid: number, total: number) {
    return true;
  }

  // return
  return (
    <div className="mx-5 space-y-10">
      <form>
        <FieldGroup className="bg-[#F9FAFB] py-4 px-5 border  border-[#E5E7EB] rounded-md">
          <div className="space-y-5">
            <h3 className="text-[#094577] text-sm font-medium">
              بيانات العميل
            </h3>
            {/* time & date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      aria-invalid={fieldState.invalid}
                      placeholder="سليمان يوسف"
                      className="bg-white"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
              {/* phone */}
              <div className="space-y-2">
                <Controller
                  name="phone"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        <span className="text-red-700 font-medium">* </span>
                        رقم الهاتف
                      </FieldLabel>
                      <div dir="ltr">
                        <PhoneInput
                          {...field}
                          id={field.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="50000000"
                          className="bg-white"
                        />
                      </div>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                <div className="inline-flex items-center gap-1.5">
                  <CircleAlert className="w-4 text-gray-800" />

                  <p className="text-xs text-gray-800">
                    يجب أن يكون مربوط بالواتس اب
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* notes */}
          <Controller
            name="notes"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  اكتب استشارتك (اختياري)
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  rows={4}
                  aria-invalid={fieldState.invalid}
                  placeholder="اكتب ملخص استشارتك بشكل واضح ومختصر."
                  className="resize-none bg-white"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>
        {/* Loading animation */}
        <LoadingAnimation />
        {/* reservation confirm */}
        <div className="space-y-2">
          {data && data.length !== 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mx-3 py-5">
              {data.map(({ owner, instant }, index: number) => (
                <div key={index} onClick={() => form.handleSubmit(() => {})()}>
                  {instant?.cost !== null &&
                  instant?.cost !== undefined &&
                  owner?.name ? (
                    <ReservationConfirm
                      lock={form.formState.isValid}
                      owner={instant.statusA ? "شاورني" : owner.name}
                      cid={owner.cid}
                      label={meetingLabel(time, date)}
                      total={instant.cost}
                      duration="30"
                      onConfirm={async () => {
                        if (instant?.cost) {
                          return await requestReserve(owner.cid, instant.cost);
                        } else {
                          toast.info({
                            message: "حدث خطأ: تكلفة غير متاحة",
                          });
                          return null;
                        }
                      }}
                    >
                      {instant.statusA ? (
                        <ConsultantCard consultant={owner} official />
                      ) : (
                        <ConsultantCard consultant={owner} />
                      )}
                    </ReservationConfirm>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 max-w-96 min-h-60 mx-auto">
              <h3 className="text-lg text-center text-gray-700 font-semibold">
                لا يوجد مستشارين متاحين للحجز الفوري الان
              </h3>
              <h6 className="text-sm text-center text-gray-700 font-semibold">
                تفقد قائمة المستشارين المتاحون خلال الساعات القادمة
              </h6>
              <Link href="/consultants">
                <Button
                  className="gap-1.5 border-theme text-theme"
                  variant="outline"
                >
                  <Clock2 className="w-5" />
                  قائمة المستشارون
                </Button>
              </Link>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
