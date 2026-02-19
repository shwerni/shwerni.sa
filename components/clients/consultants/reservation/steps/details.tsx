// packages
import { UseFormReturn, Controller } from "react-hook-form";

// schema
import { ReservationFormType } from "@/schemas";

// components
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import PhoneInput from "@/components/shared/phone-input";
import { IconLabel } from "@/components/shared/icon-label";
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import CurrencyLabel from "@/components/clients/shared/currency-label";
import GiftForm from "@/components/clients/consultants/reservation/steps/gift";

// utils
import { meetingLabel } from "@/utils/date";

// types
import { Cost } from "@/types/data";

// icons
import { CircleAlert, ChevronLeft, ChevronRight } from "lucide-react";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
  onNext: () => void;
  onBack: () => void;
}

export default function StepDetails({ form, onNext, onBack }: Props) {
  // form contorl
  const { control } = form;

  // cost
  const cost = form.getValues("cost");

  // duration
  const duration = form.watch("duration");

  return (
    <div className="space-y-6">
      {/* selected date & time summary */}
      <div className="space-y-3">
        <h5 className="text-sm font-medium text-[#094577]">
          {meetingLabel(form.getValues("date"), form.getValues("time"))}
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

        {/* duration */}
        <div className="space-y-2">
          <Controller
            name="duration"
            control={control}
            render={({ field, fieldState }) => (
              <Field
                className="w-full max-w-xs"
                data-invalid={fieldState.invalid}
              >
                <FieldLabel htmlFor="duration-pick">مدة الاستشارة</FieldLabel>
                <Select
                  value={String(field.value)}
                  onValueChange={field.onChange}
                  dir="rtl"
                >
                  <SelectTrigger
                    aria-invalid={fieldState.invalid}
                    id="duration-pick"
                  >
                    <SelectValue placeholder="اختر المدة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="30">30 دقيقة</SelectItem>
                      <SelectItem value="60">60 دقيقة</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="inline-flex items-center gap-1.5">
            <CircleAlert className="w-4 text-gray-800" />

            <p className="text-xs text-gray-800">
              مدة الجلسة <span className="font-bold"> {duration} </span> دقيقة |
              تكلفة الجلسة{" "}
              <CurrencyLabel
                amount={cost[duration as keyof Cost]}
                size="xs"
                tax={15}
                className="font-bold"
              />{" "}
              شامل الضريبة
            </p>
          </div>
        </div>

        {/* gift form */}
        <GiftForm form={form} />

        {/* notes */}
        <Controller
          name="notes"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                نص الاستشارة (اختياري)
              </FieldLabel>
              <Textarea
                {...field}
                id={field.name}
                rows={4}
                aria-invalid={fieldState.invalid}
                placeholder="شاركنا استشارتك بشكل موجز وواضح"
                className="resize-none"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {/* navigation */}
      <div className="flex items-center justify-center gap-5">
        <Button variant="ghost" type="button" onClick={onBack} size="sm">
          <ChevronRight />
          الخطوة السابقة
        </Button>
        <Button variant="primary" type="button" onClick={onNext} size="sm">
          <IconLabel
            Icon={ChevronLeft}
            label="الخطوة التالية"
            className="text-sm"
          />
        </Button>
      </div>
    </div>
  );
}
