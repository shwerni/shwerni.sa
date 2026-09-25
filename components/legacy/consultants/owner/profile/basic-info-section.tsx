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
import { Textarea } from "@/components/ui/textarea";
import { ChoiceGroup, type ChoiceOption } from "./choice-group";
import { FormSection } from "./form-section";

// lib
import { cn } from "@/lib/utils";

// prisma types
import { Gender, GenderPreference } from "@/lib/generated/prisma/enums";

// schema
import { type ProfileFormValues } from "@/schemas/consultant/profile";

// icons
import { UserRound } from "lucide-react";

// limits
const NABOUT_MAX = 150;

// options
const GENDER_OPTIONS: ChoiceOption[] = [
  { value: Gender.MALE, label: "ذكر" },
  { value: Gender.FEMALE, label: "أنثى" },
];

const PREFERENCE_OPTIONS: ChoiceOption[] = [
  { value: GenderPreference.BOTH, label: "الجميع" },
  { value: GenderPreference.MEN_ONLY, label: "الرجال فقط" },
  { value: GenderPreference.WOMEN_ONLY, label: "النساء فقط" },
];

// props
interface Props {
  disabled: boolean;
}

// name, title, about, gender, client preference
export function BasicInfoSection({ disabled }: Props) {
  const { control } = useFormContext<ProfileFormValues>();
  const nabout = useWatch({ control, name: "nabout" }) ?? "";

  return (
    <FormSection
      icon={UserRound}
      title="بيانات الإعلان"
      description="تظهر هذه البيانات للعملاء في صفحتك"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        {/* name */}
        <FormField
          control={control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>اسم الإعلان</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="مثال: أ. سارة محمد"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>الاسم الظاهر للعملاء</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* title */}
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>المسمى المهني</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  maxLength={25}
                  placeholder="مثال: أخصائية اجتماعية"
                  disabled={disabled}
                />
              </FormControl>
              <FormDescription>من 8 إلى 25 حرفاً</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* about */}
      <FormField
        control={control}
        name="nabout"
        render={({ field }) => (
          <FormItem>
            <FormLabel>نبذة مختصرة</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                rows={3}
                maxLength={NABOUT_MAX}
                placeholder="عرّف بنفسك وبطريقة عملك باختصار"
                disabled={disabled}
              />
            </FormControl>
            <div className="flex items-center justify-between gap-2">
              <FormMessage />
              <span
                className={cn(
                  "ms-auto text-xs tabular-nums",
                  nabout.length >= NABOUT_MAX
                    ? "text-red-500"
                    : "text-muted-foreground",
                )}
              >
                {nabout.length}/{NABOUT_MAX}
              </span>
            </div>
          </FormItem>
        )}
      />

      <div className="grid gap-6 sm:grid-cols-[1fr_1.5fr]">
        {/* gender */}
        <FormField
          control={control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>النوع</FormLabel>
              <FormControl>
                <ChoiceGroup
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  options={GENDER_OPTIONS}
                  disabled={disabled}
                  className="grid-cols-2"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* client preference */}
        <FormField
          control={control}
          name="preference"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تقديم الجلسات لـ</FormLabel>
              <FormControl>
                <ChoiceGroup
                  ref={field.ref}
                  value={field.value}
                  onChange={field.onChange}
                  options={PREFERENCE_OPTIONS}
                  disabled={disabled}
                  className="grid-cols-3"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </FormSection>
  );
}
