import Link from "next/link";
// packages
import { UseFormReturn, Controller } from "react-hook-form";

// schema
import { freeSessionSchemaType } from "@/schemas";

// components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import PhoneInput from "@/components/shared/phone-input";
import { IconLabel } from "@/components/shared/icon-label";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
  FieldDescription,
} from "@/components/ui/field";

// utils
import { meetingLabel } from "@/utils/date";

// icons
import { CircleAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { timeZone } from "@/lib/site/time";

// props
interface Props {
  form: UseFormReturn<freeSessionSchemaType>;
  onBack: () => void;
}

export default function StepDetails({ form, onBack }: Props) {
  // form contorl
  const {
    control,
    formState: { isSubmitting, isLoading },
  } = form;

  // date
  const { iso } = timeZone();

  return (
    <div className="space-y-6">
      {/* selected date & time summary */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-[#094577]">
          {meetingLabel(iso, form.getValues("time"))}
        </h5>
        <Separator className="w-11/12 mx-auto" />
      </div>

      {/* client info */}
      <FieldGroup>
        <div className="space-y-5">
          <h3 className="text-[#094577] text-sm font-medium">بيانات العميل</h3>
          {/* time & date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* name */}
            <Controller
              name="name"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    <span className="text-red-700 font-medium">* </span>الاسم
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
            {/* phone */}
            <div className="space-y-2">
              <Controller
                name="phone"
                control={control}
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
              <div className="inline-flex items-center gap-1.5">
                <CircleAlert className="w-4 text-gray-800" />

                <p className="text-xs text-gray-800">
                  يجب أن يكون مربوط بالواتس اب
                </p>
              </div>
            </div>
          </div>
        </div>
      </FieldGroup>

      <Controller
        name="acceptTerms"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field orientation="horizontal">
            <Checkbox
              id="acceptTerms"
              name={field.name}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
            <div className="flex flex-col gap-1.5">
              <FieldLabel htmlFor="acceptTerms" className="font-normal">
                الموافقة على الشروط والأحكام
              </FieldLabel>
              <Link href="/privacy" target="_blank">
                <FieldDescription className="text-xs">
                  اضغط لرؤية كافة الشروط والاحكام الخاصة بالعملاء
                </FieldDescription>
              </Link>
              {fieldState.invalid && (
                <FieldError errors={[fieldState.error]} className="text-xs" />
              )}
            </div>
          </Field>
        )}
      />

      {/* navigation */}
      <div className="flex items-center gap-5">
        <Button variant="ghost" type="button" onClick={onBack} size="sm">
          <ChevronRight />
          الخطوة السابقة
        </Button>
        <Button
          variant="primary"
          type="submit"
          size="sm"
          loading={isSubmitting || isLoading}
        >
          <IconLabel
            Icon={ChevronLeft}
            label="تأكيد الجلسة"
            className="text-sm"
          />
        </Button>
      </div>
    </div>
  );
}
