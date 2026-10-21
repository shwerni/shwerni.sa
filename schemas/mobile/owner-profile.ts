// packages
import { z } from "zod";

// schemas
import { ConsultantSchema } from "@/schemas";
import { BankAccountSchema } from "@/schemas/consultant/iban";
import { isCertRequired } from "@/schemas/consultant/profile";

// prisma types
import { GenderPreference } from "@/lib/generated/prisma/enums";

// session price minimums the app shows and the mobile routes enforce
export const MOBILE_MIN_COSTS = { cost30: 120, cost45: 155, cost60: 175 } as const;

// nabout length the app requires (the website keeps it optional)
const NABOUT_MIN = 10;

/**
 * minimum price for one duration, with the website's message
 * @param min lowest accepted price in sar
 */
const cost = (min: number) =>
  z.coerce
    .number()
    .positive()
    .safe()
    .min(min, { message: `يجب أن تكون التكلفة ${min} على الأقل` });

// uploaded file url (photo or pdf); ownership is checked separately against the db
const fileUrl = (message: string) => z.string().trim().url(message);

/**
 * body of POST / PATCH /api/mobile/owner/profile: the website's consultant rules, plus the
 * app's stricter ones (photo, nabout and preference required, price minimums 120 / 155 / 175)
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
    cost30: cost(MOBILE_MIN_COSTS.cost30),
    cost45: cost(MOBILE_MIN_COSTS.cost45),
    cost60: cost(MOBILE_MIN_COSTS.cost60),
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
