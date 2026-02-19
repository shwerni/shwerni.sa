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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "../ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/shared/toast";
import PhoneInput from "@/components/shared/phone-input";
import PasswordInput from "@/components/shared/password-input";

// lib
import { verifyRecaptcha } from "@/lib/api/recaptcha";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { cn } from "@/lib/utils";
import { phoneNumber } from "@/utils";

// schemas
import { RegisterSchema } from "@/schemas";

// handlers
import { register } from "@/handlers/auth/register";

const RegisterForm = () => {
  // roles data
  const data = [
    { label: "زائر", role: UserRole.USER },
    { label: "استشاري", role: UserRole.OWNER },
  ];

  // loading
  const [loading, setLoading] = React.useState(false);

  // role
  const [role, setRole] = React.useState<UserRole>(UserRole.USER);

  // default input
  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
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
  async function onSubmit(data: z.infer<typeof RegisterSchema>) {
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
    const reg = await register(
      role,
      data.username,
      data.email,
      phoneNumber(data.phone),
      data.password
    );

    // state
    if (!reg?.state) {
      // loading
      setLoading(false);

      // toast the return states
      toast.error({ title: "", message: reg?.message });

      // return
      return;
    }

    // toast the return states
    toast.info({ title: "", message: reg?.message });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="gap-5 space-y-10">
        {/* role */}
        <div className="flex justify-center items-center gap-8">
          {data.map((i, index) => (
            <div
              key={index}
              className={cn(
                "flex items-center gap-2 w-40 py-3 px-4 border border-gray-200 rounded-2xl",
                role === i.role ? "border-[#AAD6F8] bg-[#F6FAFE]" : ""
              )}
              onClick={() => setRole(i.role)}
            >
              <Image
                src={"/svg/auth/" + i.role.toLowerCase() + ".svg"}
                alt="icon"
                width={35}
                height={35}
              />
              <h3 className="text-gray-800 text-lg font-semibold">{i.label}</h3>
            </div>
          ))}
        </div>
        {/* user name */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                <span className="text-xs text-red-700">*</span> اسم المستخدم
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="ادخل الاسم الكامل"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* email */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>البريد الالكتروني </FormLabel>
              <FormControl>
                <Input
                  placeholder="username@example.com"
                  value={field.value}
                  onChange={field.onChange}
                  disabled={loading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
        {/* submit button */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          disabled={loading}
          loading={loading}
          className="w-full"
        >
          إنشاء حساب
        </Button>
      </form>
    </Form>
  );
};

export default RegisterForm;
