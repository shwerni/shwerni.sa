// React & Next
import Image from "next/image";

// packages
import { Controller, UseFormReturn } from "react-hook-form";

// components
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// schema
import { ReservationFormType } from "@/schemas";
import { PaymentMethod } from "@/lib/generated/prisma/enums";

// props
interface Props {
  form: UseFormReturn<ReservationFormType>;
}

const MethodForm = ({ form }: Props) => {
  // payments
  const finance = form.getValues("finance");

  // payment methods
  const methods = [
    {
      id: "moyassar",
      title: "الدفع بالبطاقات الإلكترونية",
      description: "الدفع الآمن باستخدام مدى، فيزا، ماستر كارد، وأبل باي.",
      value: PaymentMethod.visaMoyasar,
      src: "card.svg",
    },
    {
      id: "tabby",
      title: "الدفع بالتقسيط مع تابي",
      description:
        "قسّم المبلغ على دفعات ميسّرة بدون فوائد عبر تابي، وفق الشروط والأحكام.",
      value: PaymentMethod.tabby,
      src: "tabby-card.svg",
    },
  ] as const;

  return (
    <Controller
      name="method"
      control={form.control}
      render={({ field, fieldState }) => (
        <FieldSet data-invalid={fieldState.invalid}>
          <RadioGroup
            name={field.name}
            value={field.value}
            onValueChange={field.onChange}
            aria-invalid={fieldState.invalid}
            dir="rtl"
            className="w-11/12"
          >
            {methods.map(
              (m) =>
                finance.payments.includes(m.value) && (
                  <FieldLabel key={m.id} htmlFor={`method-${m.id}`}>
                    <Field
                      orientation="horizontal"
                      data-invalid={fieldState.invalid}
                    >
                      <FieldContent className="flex flex-row items-center gap-4">
                        <Image
                          src={`/svg/payments/${m.src}`}
                          alt={`method-${m.value}`}
                          width={100}
                          height={100}
                          className="w-18 h-12"
                        />
                        <div className="flex flex-col gap-3">
                          <FieldTitle>{m.title}</FieldTitle>
                          <FieldDescription className="text-xs">
                            {m.description}
                          </FieldDescription>
                        </div>
                      </FieldContent>
                      <RadioGroupItem
                        value={m.value}
                        id={`method-${m.id}`}
                        aria-invalid={fieldState.invalid}
                      />
                    </Field>
                  </FieldLabel>
                ),
            )}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
};

export default MethodForm;
