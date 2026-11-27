// packages
import { z } from "zod";

// schemas
import { ConsultantSchema } from "@/schemas";
import { BankAccountSchema } from "@/schemas/consultant/iban";
import { isCertRequired } from "@/schemas/consultant/profile";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// nabout length the app requires (the website keeps it optional)
const NABOUT_MIN = 10;

// a price as the app sends it; the minimums are checked by the save handler (checkPrices, from the
// pricing settings and the consultant's own lengths)
const price = z.coerce.number().positive().safe();

// uploaded file url (photo or pdf); ownership is checked separately against the db
const fileUrl = (message: string) => z.string().trim().url(message);

/**
 * body of POST / PATCH /api/mobile/owner/profile: the website's consultant rules, plus the
 * app's stricter ones (photo, nabout and preference required). prices: `costs` ("30" → price) or
 * the legacy cost30 / cost45 / cost60 (normalised by mobileCosts); their minimums are the save
 * handler's (checkPrices, from the pricing settings)
 * @param certAlwaysRequired license required regardless of category (new or recent owners)
 */
export const createMobileProfileSchema = (certAlwaysRequired: boolean) =>
  ConsultantSchema.extend({
    nabout: z
      .string()
      .trim()
      .min(NABOUT_MIN, `النبذة المختصرة لا تقل عن ${NABOUT_MIN} أحرف`)
      .max(150, "النبذة القصيرة لا تتجاوز 150 حرف"),
    preference: z.nativeEnum(GenderPreference, {
      required_error: "يرجى تحديد المستفيد من خدمتك",
    }),
    costs: z.record(z.string().regex(/^[1-9]\d*$/), price).optional(),
    cost30: price.optional(),
    cost45: price.optional(),
    cost60: price.optional(),
    years: z.coerce
      .number()
      .int("عدد السنوات يجب أن يكون رقماً صحيحاً")
      .min(0, "عدد السنوات لا يقل عن 0")
      .max(50, "عدد السنوات لا يزيد عن 50"),
    image: fileUrl("يرجى رفع صورة شخصية"),
    cv: fileUrl("يرجى رفع السيرة الذاتية"),
    edu: fileUrl("يرجى رفع شهادة المؤهل الدراسي"),
    cert: z.string().trim(),
    // optional on PATCH: the stored bank account is kept when omitted
    bank: BankAccountSchema.optional(),
  }).superRefine((values, ctx) => {
    if (isCertRequired(values.category, certAlwaysRequired) && !values.cert) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cert"],
        message: "يرجى رفع شهادة مزاولة المهنة",
      });
    }
    if (values.cert && !z.string().url().safeParse(values.cert).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["cert"],
        message: "يرجى رفع شهادة مزاولة المهنة",
      });
    }
  });

export type MobileProfileInput = z.infer<
  ReturnType<typeof createMobileProfileSchema>
>;

/**
 * the app's prices as one map ("30" → price): the legacy cost30 / cost45 / cost60, overridden by
 * `costs` for the same length. the handler keeps only the consultant's own lengths
 * @param input the parsed body
 */
export const mobileCosts = (
  input: Pick<MobileProfileInput, "costs" | "cost30" | "cost45" | "cost60">,
): Record<string, number> => {
  const legacy: Record<string, number> = {};
  if (input.cost30 !== undefined) legacy["30"] = input.cost30;
  if (input.cost45 !== undefined) legacy["45"] = input.cost45;
  if (input.cost60 !== undefined) legacy["60"] = input.cost60;
  return { ...legacy, ...(input.costs ?? {}) };
};
