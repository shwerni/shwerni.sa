// the consultant's quote and its engagement-agreement fields: the schema (the form and the action
// both use it), the price-text block and the per-field error codes. client-safe

// packages
import { z } from "zod";

// constants
import {
  PLEADING_CASE_TYPE_MAX_CHARS,
  PLEADING_CONSULTANT_TERMS_MAX,
  PLEADING_CONSULTANT_TERM_MAX_CHARS,
  PLEADING_NOTES_MAX_CHARS,
  PLEADING_SUMMARY_MAX_CHARS,
  PLEADING_SUMMARY_MAX_LINES,
} from "@/constants/pleading-agreement";

// utils
import { PLEADING_MAX_PRICE, PLEADING_MIN_PRICE } from "@/utils/pleading";

// a price written as text: digits (latin or arabic-indic) next to ريال, ر.س or SAR, either way
// round ("500 ريال", "ر.س 500", "SAR500"). the price lives only in the quote message and checkout
const DIGIT = "[0-9٠-٩]";
const CURRENCY = "(?:ريال|ر\\s?\\.\\s?س|SAR(?![A-Za-z]))";
const PRICE_TEXT = new RegExp(
  `${DIGIT}[0-9٠-٩.,٫٬\\s]*${CURRENCY}|${CURRENCY}\\s*${DIGIT}`,
  "i",
);
export const hasPriceText = (text: string) => PRICE_TEXT.test(text);

const PRICE_MESSAGE = "لا تكتب السعر هنا، السعر يظهر في العرض والدفع فقط";

// the summary as the agreement shows it: trimmed lines, no blank ones, at most 3 lines and 300
// characters (cut at a word). used on the ai draft; the schema refuses longer submissions
export function clampPleadingSummary(text: string): string {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .slice(0, PLEADING_SUMMARY_MAX_LINES);
  let out = lines.join("\n");
  if (out.length > PLEADING_SUMMARY_MAX_CHARS) {
    const cut = out.slice(0, PLEADING_SUMMARY_MAX_CHARS);
    const space = cut.lastIndexOf(" ");
    out = (space > PLEADING_SUMMARY_MAX_CHARS * 0.6 ? cut.slice(0, space) : cut).trimEnd();
  }
  return out;
}

// "" (and whitespace) means not given
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .refine((v) => !hasPriceText(v), PRICE_MESSAGE)
    .optional()
    .transform((v) => (v ? v : undefined));

// the consultant's quote: the reply and the pre-vat price (required), then the agreement's
// optional blocks. the limits apply to whatever is submitted, not only to the ai draft
export const pleadingQuoteSchema = z.object({
  plid: z.number().int().positive(),
  reply: z.string().trim().min(1, "اكتب ردك على العميل").max(2000),
  price: z
    .number()
    .int("السعر رقم صحيح بدون كسور")
    .min(PLEADING_MIN_PRICE, `السعر ${PLEADING_MIN_PRICE} ريال على الأقل`)
    .max(PLEADING_MAX_PRICE, `السعر ${PLEADING_MAX_PRICE} ريال كحد أقصى`),
  caseType: optionalText(PLEADING_CASE_TYPE_MAX_CHARS, `${PLEADING_CASE_TYPE_MAX_CHARS} حرف كحد أقصى`),
  summary: optionalText(PLEADING_SUMMARY_MAX_CHARS, `${PLEADING_SUMMARY_MAX_CHARS} حرف كحد أقصى`).refine(
    (v) => !v || v.split(/\r?\n/).length <= PLEADING_SUMMARY_MAX_LINES,
    `${PLEADING_SUMMARY_MAX_LINES} أسطر كحد أقصى`,
  ),
  // blank items are dropped; each kept one is a numbered article in the agreement
  consultantTerms: z
    .array(
      z
        .string()
        .trim()
        .max(PLEADING_CONSULTANT_TERM_MAX_CHARS, `${PLEADING_CONSULTANT_TERM_MAX_CHARS} حرف كحد أقصى`)
        .refine((v) => !hasPriceText(v), PRICE_MESSAGE),
    )
    .max(PLEADING_CONSULTANT_TERMS_MAX, `${PLEADING_CONSULTANT_TERMS_MAX} شروط كحد أقصى`)
    .default([])
    .transform((terms) => terms.filter(Boolean)),
  notes: optionalText(PLEADING_NOTES_MAX_CHARS, `${PLEADING_NOTES_MAX_CHARS} حرف كحد أقصى`),
});

export type PleadingQuoteInput = z.infer<typeof pleadingQuoteSchema>;

// the agreement fields' contact-info errors from the ai check, one code per field so the form puts
// the message under that field (contact_term_1 … contact_term_10 for the special terms)
const CONTACT_MESSAGE = "عفواً، لا يُسمح بوسائل التواصل أو الروابط في هذا الحقل.";
type TermCode = `contact_term_${number}`;
export type PleadingQuoteFieldError =
  | "contact_case_type"
  | "contact_summary"
  | "contact_notes"
  | TermCode;

export const pleadingQuoteErrors: Record<PleadingQuoteFieldError, string> = {
  contact_case_type: CONTACT_MESSAGE,
  contact_summary: CONTACT_MESSAGE,
  contact_notes: CONTACT_MESSAGE,
  ...Object.fromEntries(
    Array.from({ length: PLEADING_CONSULTANT_TERMS_MAX }, (_, i) => [`contact_term_${i + 1}`, CONTACT_MESSAGE]),
  ),
} as Record<PleadingQuoteFieldError, string>;

// the error code → the form field it belongs to
export function pleadingQuoteErrorField(
  code: string,
): { field: "caseType" | "summary" | "notes" } | { field: "consultantTerms"; index: number } | null {
  if (code === "contact_case_type") return { field: "caseType" };
  if (code === "contact_summary") return { field: "summary" };
  if (code === "contact_notes") return { field: "notes" };
  const term = /^contact_term_(\d+)$/.exec(code);
  return term ? { field: "consultantTerms", index: Number(term[1]) - 1 } : null;
}

// the agreement fields as the quote form edits them, from the latest version (a re-quote) or empty
export type PleadingAgreementDraft = {
  caseType: string;
  summary: string;
  consultantTerms: string[];
  notes: string;
};
