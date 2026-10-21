// packages
import { Controller, type UseFormReturn } from "react-hook-form";

// components
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

// schemas
import type { ReservationFormType } from "@/schemas";

// the pleading checkout's terms checkbox: the booking flow's terms form (same markup) with the
// engagement agreement in its label. "اتفاقية التكليف" opens the latest quote version's pdf in a new
// tab when it's ready, and is plain text until then (checkout never waits for the pdf)
export function PleadingTermsField({
  form,
  agreementUrl,
}: {
  form: UseFormReturn<ReservationFormType>;
  agreementUrl: string | null;
}) {
  return (
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
              <span>
                أوافق على{" "}
                {agreementUrl ? (
                  <a
                    href={agreementUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-theme underline underline-offset-2"
                  >
                    اتفاقية التكليف
                  </a>
                ) : (
                  "اتفاقية التكليف"
                )}{" "}
                الخاصة بهذا الطلب وشروط منصة شاورني
              </span>
            </FieldLabel>
            <FieldDescription className="text-xs">
              اضغط لرؤية كافة الشروط والاحكام الخاصة بالعملاء
            </FieldDescription>
            {fieldState.invalid && (
              <FieldError errors={[fieldState.error]} className="text-xs" />
            )}
          </div>
        </Field>
      )}
    />
  );
}
