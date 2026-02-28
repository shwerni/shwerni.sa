"use client";
// React & Next
import Link from "next/link";

// packages
import { Controller, UseFormReturn } from "react-hook-form";

// components
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import ConsultantCard from "../../card";
import LoadingAnimation from "../../skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import PhoneInput from "@/components/shared/phone-input";

// schema
import { InstantFormType } from "@/schemas";

// hooks
import { useOnlineConsultants } from "@/hooks/useOnlineConsultants";

// icons
import { CircleAlert, Clock2 } from "lucide-react";

// props
interface Props {
  form: UseFormReturn<InstantFormType>;
  onNext: () => void;
}

// return
export default function ReservationInstant({ form, onNext }: Props) {
  // get online consultants
  const { consultants } = useOnlineConsultants();

  // return
  return (
    <div className="mx-5 space-y-10">
      <FieldGroup className="bg-[#F9FAFB] py-4 px-5 border  border-[#E5E7EB] rounded-md">
        <div className="space-y-5">
          <h3 className="text-[#094577] text-sm font-medium">بيانات العميل</h3>
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>
      {/* Loading animation */}
      {<LoadingAnimation />}
      {/* reservation confirm */}
      <div className="space-y-2">
        {consultants?.length !== 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mx-3 py-5">
            {consultants.map((consultant, index: number) => (
              <div key={index}>
                <ConsultantCard
                  consultant={consultant}
                  onNext={onNext}
                  form={form}
                />
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
    </div>
  );
}
