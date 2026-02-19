// packages
import { motion, AnimatePresence } from "framer-motion";
import { UseFormReturn, Controller } from "react-hook-form";

// components
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import PhoneInput from "@/components/shared/phone-input";

// schemas
import { ReservationFormType } from "@/schemas";

// icons
import { Gift as GiftIcon } from "lucide-react";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
}

export default function GiftForm({ form }: Props) {
  const isGift = form.watch("hasBeneficiary");

  return (
    <>
      {/* Gifted option */}
      <div className="flex justify-between items-center bg-[#F1F8FE] py-4 px-5 rounded-md">
        <Controller
          name="hasBeneficiary"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field orientation="horizontal" data-invalid={fieldState.invalid}>
              <Checkbox
                id={`form-rhf-checkbox`}
                name={field.name}
                aria-invalid={fieldState.invalid}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
              <FieldLabel htmlFor={`form-rhf-checkbox`} className="font-normal">
                أهدِ استشارتك ليجد الدعم الذي يستحقه.{" "}
              </FieldLabel>
            </Field>
          )}
        />
        <GiftIcon className="w-4 h-4 text-theme" />
      </div>

      {/* Animate gift fields */}
      <AnimatePresence>
        {isGift && (
          <motion.div
            key="gift-fields"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="space-y-5 mt-4 p-4 border rounded-lg bg-white dark:bg-gray-800"
          >
            <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-200 flex items-center gap-2">
              بيانات المهدى له
            </h4>

            {/* Gift name */}
            <Controller
              name="beneficiaryName"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>اسم المستلم</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    autoComplete="off"
                    placeholder="اسم المستلم"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Gift phone */}
            <Controller
              name="beneficiaryPhone"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field
                  className="w-full max-w-80"
                  data-invalid={fieldState.invalid}
                >
                  <FieldLabel>رقم هاتف المستلم</FieldLabel>

                  <div dir="ltr" className="space-y-1">
                    <PhoneInput
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldDescription className="text-xs mt-1 text-right">
                      رقم الهاتف الذي سيتم التواصل معه
                    </FieldDescription>
                  </div>

                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
