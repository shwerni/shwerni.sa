"use client";
// React & Next
import React from "react";
import Link from "next/link";

// components
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

// icons
import { ArrowLeft } from "lucide-react";
import Logo from "../shared/logo";
import { PhoneSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import PhoneInput from "../shared/phone-input";
import { Field, FieldError, FieldLabel } from "../ui/field";
import z from "zod";
import { forgetpassowrd } from "@/handlers/auth/reset";
import { toast } from "../shared/toast";
import { phoneNumber } from "@/utils";

export function ForgetPasswordForm() {
  // form
  const form = useForm<z.infer<typeof PhoneSchema>>({
    resolver: zodResolver(PhoneSchema),
    defaultValues: {
      // form
      phone: "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  async function onSubmit(data: z.infer<typeof PhoneSchema>) {
    // clean phone number
    data.phone = phoneNumber(data.phone);

    // reset password
    const response = await forgetpassowrd(data);

    // taost error
    if (response.state === false) toast.error({ message: response.message });
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-lg border-slate-200">
        <div className="text-center mb-8">
          {/* main logo */}
          <div className="flex justify-center">
            <Logo width={200} height={200} />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            إعادة تعيين كلمة المرور
          </h1>
          <p className="text-slate-600 text-sm">
            أدخل بريدك الإلكتروني لإرسال رابط التحقق
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
          {/* phone */}
          <div className="space-y-2">
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    <span className="text-red-700 font-medium">* </span>رقم
                    الهاتف
                  </FieldLabel>
                  <div dir="ltr">
                    <PhoneInput
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="50000000"
                    />
                  </div>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full"
            loading={form.formState.isLoading || form.formState.isSubmitting}
          >
            إرسال رابط التحقق
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 text-gray-800 font-semibold hover:underline text-sm"
          >
            <ArrowLeft size={16} />
            العودة للدخول
          </Link>
        </div>
      </Card>
    </div>
  );
}
