"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

// components
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneInput from "@/components/shared/phone-input";
import PasswordInput from "@/components/shared/password-input";

// lib
import { verifyRecaptcha } from "@/lib/api/recaptcha";

// utils
import { phoneNumber } from "@/utils";

// schemas
import { LogInSchema } from "@/schemas";

// handlers
import { login } from "@/handlers/auth/login";

// consultant profile handler
const LogInForm = () => {
  // high priority for button loading effect
  const [loading, setLoading] = React.useState(false);

  // default input
  const form = useForm<z.infer<typeof LogInSchema>>({
    resolver: zodResolver(LogInSchema),
    defaultValues: {
      // password
      password: "",
      // phone
      phone: "",
    },
  });

  // reCaptcha-v3
  const { executeRecaptcha } = useGoogleReCaptcha();

  // on submit
  async function onSubmit(data: z.infer<typeof LogInSchema>) {
    // start loading
    setLoading(true);

    // reCaptcha-v3 handler
    if (!executeRecaptcha) {
      // toast
      toast.error({
        title: "حدث خطأ ما",
        message:
          "حدثت مشكلة اثناء التحقق من الامان, برجاء المحاولة لاحقا او تواصل مع الدعم",
      });

      // loading
      setLoading(false);

      // return
      return;
    }

    // execute recaptcha
    const token = await executeRecaptcha();

    // verify recaptcha
    const recaptcha = await verifyRecaptcha(token);

    // validate
    if (!token || !recaptcha) {
      // toast
      toast.error({
        title: "حدث خطأ ما",
        message:
          "حدثت مشكلة اثناء التحقق من الامان, برجاء المحاولة لاحقا او تواصل مع الدعم",
      });

      // loading
      setLoading(false);

      // return
      return;
    }
    
    // handle register fields submited data
    const log = await login(phoneNumber(data.phone), data.password);

    // state
    if (!log?.state) {
      // loading
      setLoading(false);

      // toast the return states
      toast.error({ title: "", message: log?.message });

      // return
      return;
    }

    // toast the return states
    toast.info({ title: "", message: log?.message });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="gap-5 space-y-10">
        {/* phone number */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="text-xs text-red-700">*</span> رقم الهاتف
              </FormLabel>
              <FormControl>
                <div dir="ltr">
                  <PhoneInput
                    value={field.value}
                    onChange={field.onChange}
                    disabled={loading}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* password */}
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                {/* password */}
                <FormLabel>
                  <span className="text-xs text-red-700">*</span>كلمة المرور
                </FormLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="كلمة المرور"
                    {...field}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* remember be & forget passwrod */}
          <div className="flex justify-between">
            <div className="inline-flex items-center gap-2">
              <Checkbox />
              <Label className="text-xs text-gray-500">تذكرني</Label>
            </div>
            <Link
              href="/forgetpassowrd"
              className="text-gray-500 text-xs hover:underline"
            >
              هل نسيت كلمة المرور؟
            </Link>
          </div>
        </div>
        {/* submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          loading={loading}
          className="w-full"
        >
          تسجيل الدخول
        </Button>
      </form>
    </Form>
  );
};

export default LogInForm;
