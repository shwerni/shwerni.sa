// packages
import { z } from "zod";

// prisma types
import { Gender, PaymentMethod, Relation } from "@/lib/generated/prisma/enums";

// schemas
import { schemas } from "@/schemas/schemas";

// utils
import { genderLabel, relationLabel } from "@/utils";

// constants
export const RECONCILIATION_DURATION = "60"; // one fixed 60 minute session
export const RECONCILIATION_DESCRIPTION_MAX = 500;

// arabic messages for the reconciliation checkout's own error codes (pass to useAction's errors)
export const reconciliationErrors = {
  unavailable: "خدمة جلسات الصلح غير متاحة حالياً",
  blocked: "هذا الحساب محظور",
  slot_taken: "هذا الموعد تم حجزه بالفعل، برجاء اختيار وقت آخر",
  payment_failed:
    "تعذّر إتمام الدفع، برجاء المحاولة مرة أخرى أو اختيار طريقة دفع أخرى",
} as const;

// bot_detected is a base code (types/action.d.ts) that lib/safe-action's own list doesn't include
export type ReconciliationError =
  | keyof typeof reconciliationErrors
  | "bot_detected";

// digits only, as the booking form sends it (phoneNumber in utils), then the shared phone rule
const phone = z
  .string()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(schemas.phone);

// the checkout: the client's choices only. no price, coupon, discount, consultant or duration
// fields exist on purpose: the server takes them from the finance settings
export const reconciliationCheckoutSchema = z.object({
  // the session
  date: z.coerce.date({ required_error: "التاريخ مطلوب" }),
  time: z.string({ required_error: "الوقت مطلوب" }).min(1, "الوقت مطلوب"),

  // the client (the same name rule as bookings: reserveConsultant re-validates it)
  name: schemas.name,
  phone,
  description: z
    .string()
    .trim()
    .max(
      RECONCILIATION_DESCRIPTION_MAX,
      `${RECONCILIATION_DESCRIPTION_MAX} حرف كحد أقصى`,
    )
    .optional()
    .default(""),

  // the other party (kept on the Reconciliation row; the phone only for the admin team)
  otherName: z
    .string()
    .trim()
    .min(2, "اسم الطرف الآخر مطلوب")
    .max(50, "50 حرف كحد أقصى"),
  otherPhone: phone,
  relation: z.nativeEnum(Relation, {
    required_error: "يرجى اختيار العلاقة بالطرف الآخر",
  }),
  gender: z.nativeEnum(Gender, {
    required_error: "يرجى اختيار جنس الطرف الآخر",
  }),

  // payment
  method: z.nativeEnum(PaymentMethod, {
    required_error: "برجاء اختيار طريقة دفع",
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "يجب الموافقة على الشروط والأحكام للمتابعة" }),
  }),
});

export type ReconciliationCheckoutInput = z.infer<
  typeof reconciliationCheckoutSchema
>;

// the session chat's first message (the consultant's brief): the other party's name, relation
// and gender, then the description when given. never the other party's phone: it stays on the
// Reconciliation row for the admin team
export const reconciliationFirstMessage = (input: {
  otherName: string;
  relation: Relation;
  gender: Gender;
  description?: string | null;
}) => {
  const lines = [
    "طلب جلسة صلح",
    `الطرف الآخر: ${input.otherName.trim()}`,
    `العلاقة: ${relationLabel(input.relation)}`,
    `الجنس: ${genderLabel(input.gender)}`,
  ];

  const description = input.description?.trim();
  if (description) lines.push("", "تفاصيل الخلاف:", description);

  return lines.join("\n");
};
