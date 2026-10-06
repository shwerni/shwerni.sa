// packages
import { z } from "zod";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// constants
import { centerThemes } from "@/constants/theme/center";

// images must come from our upload flow (uploadthing hosts, the same ones next/image allows)
const UPLOAD_HOSTS = ["utfs.io", "huqzhdqiy3.ufs.sh"];
const uploadUrl = z
  .string()
  .trim()
  .url("رابط الصورة غير صالح")
  .refine((v) => {
    try {
      const u = new URL(v);
      return u.protocol === "https:" && UPLOAD_HOSTS.includes(u.hostname);
    } catch {
      return false;
    }
  }, "ارفع الصورة من خلال زر الرفع");

// optional text: "" from the form becomes null in the database
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `${max} حرف كحد أقصى`)
    .transform((v) => (v === "" ? null : v));

const phone = z
  .string()
  .trim()
  .regex(/^\d{9,15}$/, "رقم الهاتف أرقام فقط (9 إلى 15 رقماً)");

// what a center may edit on its own profile (centers spec §11.2). never slug, status,
// platformRate, sort_key, ceid or the legal numbers: those are admin-only
export const centerProfileSchema = z.object({
  name: z.string().trim().min(2, "الاسم مطلوب").max(80, "80 حرف كحد أقصى"),
  description: optionalText(2000),
  logo: uploadUrl.nullable(),
  cover: uploadUrl.nullable(),
  city: z.string().trim().min(2, "المدينة مطلوبة").max(60),
  district: optionalText(60),
  address: z.string().trim().min(5, "العنوان مطلوب").max(200),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  phone,
  whatsapp: z
    .union([phone, z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  email: z
    .union([z.string().trim().email("البريد الإلكتروني غير صالح"), z.literal("")])
    .transform((v) => (v === "" ? null : v)),
  preference: z.nativeEnum(GenderPreference),
  amenities: z
    .array(z.string().trim().min(1).max(40))
    .max(20, "20 ميزة كحد أقصى"),
  policy: optionalText(1000),
});

export type CenterProfileInput = z.input<typeof centerProfileSchema>;

// theme: one of the curated themes plus optional hex-only overrides of its five colors
const hex = z
  .string()
  .regex(/^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i, "لون غير صالح");

export const centerThemeSchema = z.object({
  themeKey: z.enum(Object.keys(centerThemes) as [keyof typeof centerThemes]),
  themeVars: z
    .object({
      primary: hex.optional(),
      primaryForeground: hex.optional(),
      secondary: hex.optional(),
      secondarySoft: hex.optional(),
      accent: hex.optional(),
    })
    .strict()
    .nullable(),
});

export type CenterThemeInput = z.infer<typeof centerThemeSchema>;
