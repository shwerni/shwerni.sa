// packages
import { UseFormReturn, Controller } from "react-hook-form";

// schema
import { ProgramReservationFormType } from "@/schemas";

// components
import {
  Field,
  FieldLabel,
  FieldError,
  FieldGroup,
} from "@/components/ui/field";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import PhoneInput from "@/components/shared/phone-input";
import { IconLabel } from "@/components/shared/icon-label";
import StarBadge from "@/components/clients/shared/star-badge";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";

// lib
import { Consultant } from "@/lib/generated/prisma/client";

// utils
import { cn } from "@/lib/utils";

// icons
import { CircleAlert, ChevronLeft } from "lucide-react";

// props
interface Props {
  onNext: () => void;
  form: UseFormReturn<ProgramReservationFormType>;
  consultants: Pick<
    Consultant,
    "cid" | "category" | "name" | "image" | "rate" | "gender"
  >[];
}

export default function StepDetails({ form, consultants, onNext }: Props) {
  // form contorl
  const { control } = form;

  // cid
  const cid = form.watch("cid");

  return (
    <div className="space-y-6">
      {/* client info */}
      <FieldGroup>
        <div className="space-y-5">
          <h3 className="text-[#094577] text-sm font-medium">بيانات العميل</h3>
          {/* name & phone */}
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

      {/* consultants */}
      <div>
        <Carousel
          opts={{
            align: "start",
          }}
          className="w-full"
        >
          <CarouselContent>
            {consultants.map((consultant, index) => (
              <CarouselItem
                key={index}
                className="basis-1/3 lg:basis-1/4"
                onClick={() => {
                  form.setValue("cid", consultant.cid);
                  form.setValue("consultant", consultant.name);
                  // @ts-expect-error - this is a hack to reset time when date changes
                  form.setValue("time", undefined);
                  // @ts-expect-error - this is a hack to reset time when date changes
                  form.setValue("date", undefined);
                }}
              >
                <Card
                  className={cn(
                    consultant.cid === cid && "border-2 border-theme",
                    "p-0 shadow-lg",
                  )}
                >
                  <CardContent className="flex flex-col items-center justify-center gap-y-3 p-3">
                    <div className="relative">
                      {/* image */}
                      <ConsultantImage
                        image={consultant.image}
                        name={consultant.name}
                        gender={consultant.gender}
                      />
                      {/* stars */}
                      {consultant.rate && consultant.rate > 0 ? (
                        <StarBadge
                          rate={consultant.rate}
                          className="absolute -bottom-1.5 left-1/2 -translate-x-1/2"
                          size="xs"
                          variant="white"
                        />
                      ) : (
                        ""
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-[#094577]">
                      {consultant.name}
                    </h3>
                    <CategoryBadge size="sm" category={consultant.category} />
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
      {/* navigation */}
      <Button variant="primary" type="button" onClick={onNext} size="sm">
        <IconLabel
          Icon={ChevronLeft}
          label="الخطوة التالية"
          className="text-sm"
        />
      </Button>
    </div>
  );
}
