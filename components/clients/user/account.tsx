"use client";
// components
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/shared/phone-input";

// schema
import { UserInfoSchema, UserInfoSchemaType } from "@/schemas";

// types
import { User } from "next-auth";

// pacakges
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

// icons
import { CircleAlert, IdCard, KeyRound, Pencil } from "lucide-react";

interface Props {
  user: User;
}

const UserAccount = ({ user }: Props) => {
  // form
  const form = useForm<UserInfoSchemaType>({
    resolver: zodResolver(UserInfoSchema),
    defaultValues: {
      name: user.name || "",
      email: user.email || "",
      phone: `+${user.phone}` || "",
    },
    mode: "onChange",
    reValidateMode: "onChange",
    shouldUnregister: false,
  });

  async function onSubmit(data: UserInfoSchemaType) {}

  return (
    <div className="max-w-2xl py-10 px-4 mx-auto space-y-8">
      <div className="space-y-3">
        <div className="inline-flex gap-1.5">
          <IdCard className="w-5 text-theme" />
          <h3>معلومات المستخدم</h3>
        </div>
        <div className="bg-theme h-0.5 w-10/12 max-w-sm" />
      </div>
      {/* form */}
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FieldSet disabled={true} className="space-y-8">
          <FieldGroup>
            <div className="space-y-5">
              <h3 className="text-[#094577] text-sm font-medium">
                بيانات العميل
              </h3>
              {/* time & date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
                {/* email */}
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        البريد الالكتروني
                      </FieldLabel>
                      <Input
                        {...field}
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                        placeholder="user@example.com"
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
                  <div className="inline-flex items-center gap-1.5">
                    <CircleAlert className="w-4 text-gray-800" />

                    <p className="text-xs text-gray-800">
                      يجب أن يكون مربوط بالواتس اب
                    </p>
                  </div>
                </div>
              </div>
            </div>
            {/* submit button */}
            <Button className="gap-1" variant="secondary">
              <KeyRound className="w-5" />
              تغيير كلمة المرور
            </Button>
          </FieldGroup>
          <FieldSeparator className="max-w-md" />
          {/* navigation */}
          <Button variant="primary" type="submit">
            <Pencil />
            التعديلات حفظ
          </Button>
        </FieldSet>
      </form>
    </div>
  );
};

export default UserAccount;
