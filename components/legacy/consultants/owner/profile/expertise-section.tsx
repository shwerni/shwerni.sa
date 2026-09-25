"use client";
// packages
import { useFormContext, useWatch } from "react-hook-form";

// components
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ChoiceGroup, type ChoiceOption } from "./choice-group";
import { DynamicListField } from "./dynamic-list-field";
import { FormSection } from "./form-section";

// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

// constants
import { categories } from "@/constants/admin";
import { CATEGORY_QUALIFICATIONS } from "./qualifications";

// schema
import { type ProfileFormValues } from "@/schemas/consultant/profile";

// icons
import { GraduationCap, Info } from "lucide-react";

// active categories only
const CATEGORY_OPTIONS: ChoiceOption[] = categories
  .filter((category) => category.status)
  .map((category) => ({ value: category.id, label: category.label }));

// props
interface Props {
  disabled: boolean;
}

// category, seniority, education, experiences
export function ExpertiseSection({ disabled }: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  const category = useWatch({ control, name: "category" });
  const qualification = CATEGORY_QUALIFICATIONS[category as Categories];

  return (
    <FormSection
      icon={GraduationCap}
      title="التخصص والخبرة"
      description="تُراجَع هذه البيانات مع مستنداتك قبل نشر الإعلان"
    >
      {/* category */}
      <FormField
        control={control}
        name="category"
        render={({ field }) => (
          <FormItem>
            <FormLabel>الفئة</FormLabel>
            <FormControl>
              <ChoiceGroup
                ref={field.ref}
                value={field.value}
                onChange={field.onChange}
                options={CATEGORY_OPTIONS}
                disabled={disabled}
                className="grid-cols-2 sm:grid-cols-4"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* acceptance requirements for the selected category */}
      {qualification && (
        <div className="flex gap-2 rounded-lg bg-zgrey-50 p-3 text-xs leading-relaxed">
          <Info className="w-4 h-4 mt-0.5 shrink-0 text-zblue-200" />
          <p>
            <span className="font-semibold">شروط القبول: </span>
            {qualification}
          </p>
        </div>
      )}

      {/* seniority */}
      <FormField
        control={control}
        name="years"
        render={({ field }) => (
          <FormItem>
            <FormLabel>سنوات الخبرة</FormLabel>
            <FormControl>
              <Input
                {...field}
                type="number"
                inputMode="numeric"
                min={0}
                max={50}
                className="max-w-32"
                disabled={disabled}
              />
            </FormControl>
            <FormDescription>من 0 إلى 50 سنة</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* education */}
      <DynamicListField
        name="neducation"
        label="المؤهلات العلمية"
        itemPlaceholder="المؤهل"
        addLabel="إضافة مؤهل"
        max={3}
        disabled={disabled}
      />

      {/* experiences */}
      <DynamicListField
        name="nexperiences"
        label="الخبرات"
        itemPlaceholder="الخبرة"
        addLabel="إضافة خبرة"
        max={3}
        disabled={disabled}
      />
    </FormSection>
  );
}
