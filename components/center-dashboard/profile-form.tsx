"use client";
// React & Next
import React from "react";

// packages
import { useForm } from "react-hook-form";

// components
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UploadField } from "@/components/shared/upload-btn";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Panel } from "@/components/center-dashboard/ui";

// hooks
import { useAction } from "@/hooks/use-action";

// actions
import { saveCenterProfile } from "@/actions/center/settings";

// schemas
import { centerProfileSchema } from "@/schemas/center";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/browser";

// types
import type { CenterSettings } from "@/data/center/dashboard";

// icons
import { Building2, ImageIcon, Loader2, MapPin, Phone, Sparkles } from "lucide-react";

const PREFERENCES: { value: GenderPreference; label: string }[] = [
  { value: GenderPreference.BOTH, label: "للجميع" },
  { value: GenderPreference.MEN_ONLY, label: "للرجال فقط" },
  { value: GenderPreference.WOMEN_ONLY, label: "للنساء فقط" },
];

type FormValues = {
  name: string;
  description: string;
  logo: string | null;
  cover: string | null;
  city: string;
  district: string;
  address: string;
  lat: string;
  lng: string;
  phone: string;
  whatsapp: string;
  email: string;
  preference: GenderPreference;
  // one amenity per line
  amenities: string;
  policy: string;
};

// the center's profile (no slug, status, platform rate or legal numbers: admin-only)
export function ProfileForm({ center }: { center: CenterSettings }) {
  const form = useForm<FormValues>({
    defaultValues: {
      name: center.name,
      description: center.description ?? "",
      logo: center.logo,
      cover: center.cover,
      city: center.city,
      district: center.district ?? "",
      address: center.address,
      lat: String(center.lat),
      lng: String(center.lng),
      phone: center.phone,
      whatsapp: center.whatsapp ?? "",
      email: center.email ?? "",
      preference: center.preference,
      amenities: center.amenities.join("\n"),
      policy: center.policy ?? "",
    },
  });
  const { register, handleSubmit, setError, clearErrors, formState, watch, setValue } = form;

  const { execute, isPending } = useAction(saveCenterProfile, {
    success: "تم حفظ بيانات المركز",
  });

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      amenities: values.amenities
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean),
    };

    // the same schema the action checks on the server, for inline messages
    const parsed = centerProfileSchema.safeParse(payload);
    clearErrors();
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FormValues;
        if (key) setError(key, { message: issue.message });
      }
      return;
    }
    execute(payload);
  }

  const err = (k: keyof FormValues) => formState.errors[k]?.message;
  const field = (k: keyof FormValues, label: string, el: React.ReactNode, required = false) => (
    <Field data-invalid={!!err(k)}>
      <FieldLabel htmlFor={`center-${k}`}>
        {required && <span className="font-medium text-red-700">* </span>}
        {label}
      </FieldLabel>
      {el}
      {err(k) && <FieldError errors={[{ message: err(k) }]} />}
    </Field>
  );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <Panel title="الهوية" icon={Building2}>
        <div className="grid gap-4">
          {field("name", "اسم المركز", <Input id="center-name" {...register("name")} />, true)}
          {field(
            "description",
            "عن المركز",
            <Textarea id="center-description" rows={5} {...register("description")} />,
          )}
          {field(
            "preference",
            "الفئة المستهدفة",
            <Select
              value={watch("preference")}
              onValueChange={(v) => setValue("preference", v as GenderPreference)}
              dir="rtl"
            >
              <SelectTrigger id="center-preference" className="w-full sm:w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PREFERENCES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>,
          )}
        </div>
      </Panel>

      <Panel title="الشعار والغلاف" icon={ImageIcon}>
        <div className="grid gap-4 sm:grid-cols-2">
          <UploadField
            name="logo"
            type="image"
            control={form.control}
            label="الشعار"
            previewUrl={center.logo ?? undefined}
          />
          <UploadField
            name="cover"
            type="image"
            control={form.control}
            label="صورة الغلاف"
            previewUrl={center.cover ?? undefined}
          />
        </div>
        {(err("logo") || err("cover")) && (
          <p className="mt-2 text-sm text-destructive">{err("logo") ?? err("cover")}</p>
        )}
      </Panel>

      <Panel title="الموقع" icon={MapPin}>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("city", "المدينة", <Input id="center-city" {...register("city")} />, true)}
          {field("district", "الحي", <Input id="center-district" {...register("district")} />)}
          <div className="sm:col-span-2">
            {field("address", "العنوان", <Input id="center-address" {...register("address")} />, true)}
          </div>
          {field(
            "lat",
            "خط العرض (lat)",
            <Input id="center-lat" dir="ltr" inputMode="decimal" {...register("lat")} />,
            true,
          )}
          {field(
            "lng",
            "خط الطول (lng)",
            <Input id="center-lng" dir="ltr" inputMode="decimal" {...register("lng")} />,
            true,
          )}
        </div>
      </Panel>

      <Panel title="التواصل" icon={Phone}>
        <div className="grid gap-4 sm:grid-cols-3">
          {field(
            "phone",
            "الهاتف",
            <Input id="center-phone" dir="ltr" inputMode="tel" {...register("phone")} />,
            true,
          )}
          {field(
            "whatsapp",
            "واتساب",
            <Input id="center-whatsapp" dir="ltr" inputMode="tel" {...register("whatsapp")} />,
          )}
          {field(
            "email",
            "البريد الإلكتروني",
            <Input id="center-email" dir="ltr" type="email" {...register("email")} />,
          )}
        </div>
      </Panel>

      <Panel title="المرافق والسياسة" icon={Sparkles}>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "amenities",
            "المرافق (ميزة في كل سطر)",
            <Textarea id="center-amenities" rows={5} {...register("amenities")} />,
          )}
          {field(
            "policy",
            "سياسة الحضور والإلغاء",
            <Textarea id="center-policy" rows={5} {...register("policy")} />,
          )}
        </div>
      </Panel>

      <div className="sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] flex justify-end lg:bottom-4">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-(--center-primary) px-6 font-semibold text-(--center-primary-foreground) shadow-sm transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending && <Loader2 className="size-4 animate-spin" />}
          حفظ التغييرات
        </button>
      </div>
    </form>
  );
}
