"use client";
// React & Next
import React from "react";
import { redirect } from "next/navigation";

// packages
import z from "zod";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// components
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/shared/phone-input";
import PasswordInput from "@/components/shared/password-input";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";

// utils
import { phoneNumber } from "@/utils";

// handlers
import { login } from "@/handlers/auth/login";

// schema
import { LogInSchema } from "@/schemas";

// icons
import { Loader2, Shield } from "lucide-react";

type LoginType = z.infer<typeof LogInSchema>;

export default function Page() {
  const [loading, setLoading] = React.useState(false);

  // form
  const form = useForm<LoginType>({
    resolver: zodResolver(LogInSchema),
    defaultValues: {
      phone: "+966",
      password: "",
    },
  });

  const onSubmit = async (data: LoginType) => {
    // loading state
    setLoading(true);

    // login
    const response = await login(phoneNumber(data.phone), data.password, true);

    if (response?.state === false) {
      // error
      toast.error(response.message);
      // loading state
      setLoading(false);
      // return
      return;
    }

    // toast
    toast.success("تم تسجيل دخول الموظف بنجاح!");

    // redirect
    redirect("/employees");
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-primary via-primary/95 to-primary/90 flex items-center justify-center p-4 relative overflow-hidden">
      <Card className="w-full max-w-md p-8 shadow-2xl border-0 relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-primary mb-2">
            دخول الموظفين
          </h1>
          <p className="text-slate-600 text-sm">
            أدخل بيانات الموظف للوصول إلى لوحة النظام الداخلية
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Controller
              name="phone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>رقم الهاتف</FieldLabel>
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

          {/* Password */}
          <div>
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>كلمة المرور</FieldLabel>
                  <PasswordInput
                    {...field}
                    type="password"
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            {form.formState.errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {/* Remember Me */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="rememberMe"
              className="w-4 h-4 accent-primary cursor-pointer"
            />
            <label htmlFor="rememberMe" className="text-sm text-slate-600">
              تذكرني على هذا الجهاز
            </label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90 text-white mt-6 font-bold"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                جاري تسجيل الدخول...
              </div>
            ) : (
              "دخول إلى لوحة التحكم"
            )}
          </Button>
        </form>
      </Card>
    </div>
  );
}
