// React & Next
import Link from "next/link";

// packages
import { Controller, UseFormReturn } from "react-hook-form";

// components
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Checkbox } from "@/components/ui/checkbox";

// schema
import { ReservationFormType } from "@/schemas";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
}

const TermsForm = ({ form }: Props) => {
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
  );
};

export default TermsForm;
