// packages
import { z } from "zod";

// schemas
import { ConsultantSchema } from "@/schemas";

// prisma types
import {
  Categories,
  Gender,
  GenderPreference,
} from "@/lib/generated/prisma/enums";
import { BankAccount, Consultant } from "@/lib/generated/prisma/client";

// lib
import { formatIban } from "@/lib/api/gatewaies/iban";

// pricing
import { checkPrices } from "@/utils/pricing";
import type { PricingSettings } from "@/constants/pricing";
import { BankAccountSchema } from "./iban";

// consultants created after this date must upload a license regardless of category
const CERT_POLICY_DATE = new Date("2025-08-01");

// categories that always require a practice license
const CERT_REQUIRED_CATEGORIES: readonly string[] = [
  Categories.LAW,
  Categories.PSYCHIC,
];

// document fields handled by upload buttons
export type DocumentField = "image" | "cv" | "edu" | "cert";

// license required for everyone who is new or joined after the policy date
export const isCertAlwaysRequired = (owner: Consultant | null) =>
  !owner || owner.created_at > CERT_POLICY_DATE;

// single rule shared by the schema and the UI badge
export const isCertRequired = (
  category: string | undefined,
  certAlwaysRequired: boolean,
) =>
  certAlwaysRequired ||
  (!!category && CERT_REQUIRED_CATEGORIES.includes(category));

// the price fields' rules, from the server page: the cached pricing settings, the consultant's own
// lengths (his override, else the default) and his stored prices (null before he has a profile)
export interface ProfilePricing {
  settings: PricingSettings;
  durations: number[];
  current: Record<string, number> | null;
}

// profile form schema: server schema + uploads + seniority + bank, validated in one pass. the
// prices follow checkPrices, the same rule the server applies
export const createProfileFormSchema = (
  certAlwaysRequired: boolean,
  pricing: ProfilePricing,
) =>
  ConsultantSchema.extend({
    // bank: holderName + iban (checksum and known-bank checks live in BankAccountSchema)
    ...BankAccountSchema.shape,
    years: z.coerce
      .number()
      .int("عدد السنوات يجب أن يكون رقماً صحيحاً")
      .min(0, "عدد السنوات لا يقل عن 0")
      .max(50, "عدد السنوات لا يزيد عن 50"),
    image: z.string(),
    cv: z.string().min(1, "يرجى رفع السيرة الذاتية"),
    edu: z.string().min(1, "يرجى رفع شهادة المؤهل الدراسي"),
    cert: z.string(),
  }).superRefine((values, ctx) => {
    if (isCertRequired(values.category, certAlwaysRequired) && !values.cert) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cert"],
        message: "يرجى رفع شهادة مزاولة المهنة",
      });
    }
    const prices = checkPrices(
      pricing.settings,
      pricing.durations,
      values.costs,
      pricing.current,
    );
    if (!prices.ok) {
      for (const [minutes, message] of Object.entries(prices.errors)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["costs", minutes], message });
      }
    }
  });

// form values
export type ProfileFormValues = z.infer<
  ReturnType<typeof createProfileFormSchema>
>;

// seniority: stored as a start date, edited as a number of years
export function dateToYears(date: Date) {
  const today = new Date();
  let years = today.getFullYear() - date.getFullYear();

  // adjust if the anniversary hasn't happened yet this year
  const hasHadAnniversary =
    today.getMonth() > date.getMonth() ||
    (today.getMonth() === date.getMonth() && today.getDate() >= date.getDate());
  if (!hasHadAnniversary) years -= 1;

  return Math.max(0, Math.min(50, years));
}

export function yearsToDate(years: number) {
  const today = new Date();
  return new Date(
    today.getFullYear() - years,
    today.getMonth(),
    today.getDate(),
  );
}

// default values for create and edit
export const getProfileFormDefaults = (
  owner: Consultant | null,
  bankAccount: BankAccount | null,
  pricing: ProfilePricing,
): ProfileFormValues => ({
  // bank
  holderName: bankAccount?.holderName ?? "",
  iban: bankAccount ? formatIban(bankAccount.iban) : "SA",
  // listing
  name: owner?.name ?? "",
  title: owner?.title ?? "",
  nabout: owner?.nabout ?? "",
  gender: owner?.gender ?? Gender.MALE,
  preference: owner?.preference ?? GenderPreference.BOTH,
  // expertise
  category: owner?.category ?? Categories.FAMILY,
  years: owner?.seniority ? dateToYears(new Date(owner.seniority)) : 1,
  neducation: owner?.neducation?.length ? owner.neducation : [""],
  nexperiences: owner?.nexperiences?.length ? owner.nexperiences : [""],
  // pricing: one price per length he sells (his stored price, 0 before he enters one)
  costs: Object.fromEntries(
    pricing.durations.map((minutes) => [String(minutes), pricing.current?.[String(minutes)] ?? 0]),
  ),
  // documents
  image: owner?.pendingImage ?? owner?.image ?? "",
  cv: owner?.cv ?? "",
  edu: owner?.edu ?? "",
  cert: owner?.cert ?? "",
});
