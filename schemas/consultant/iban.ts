import z from "zod";
import { checkSaudiIban } from "@/lib/iban";

const IBAN_ERRORS = {
  format: "رقم الآيبان يجب أن يبدأ بـ SA ويتكون من 24 خانة",
  checksum: "رقم الآيبان غير صحيح، يرجى التحقق منه",
  unknown_bank: "البنك غير مدعوم، يرجى التواصل مع الدعم",
} as const;

export const BankAccountSchema = z.object({
  holderName: z
    .string()
    .trim()
    .min(3, "يرجى إدخال اسم صاحب الحساب كما هو مسجل في البنك")
    .max(100, "الاسم طويل جداً"),
  // superRefine (not transform) keeps input/output types identical for react-hook-form
  iban: z.string().superRefine((value, ctx) => {
    const result = checkSaudiIban(value);
    if (!result.ok) ctx.addIssue({ code: "custom", message: IBAN_ERRORS[result.reason] });
  }),
});