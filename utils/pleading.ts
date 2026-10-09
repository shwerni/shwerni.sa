// packages
import { z } from "zod";

// prisma types
import { PaymentMethod, PleadingState } from "@/lib/generated/prisma/enums";

// schemas
import { schemas } from "@/schemas/schemas";

// constants
export const PLEADING_DURATION = "60"; // one fixed 60 minute session
export const PLEADING_TTL_DAYS = 7; // unquoted cases and quotes both expire after 7 days
export const PLEADING_MAX_FILES = 5; // attachments with the request
export const PLEADING_MIN_PRICE = 100; // pre-vat whole sar
export const PLEADING_MAX_PRICE = 100000;

// states where both sides can still write in the case chat
export const PLEADING_OPEN_STATES: PleadingState[] = [
  PleadingState.REQUESTED,
  PleadingState.QUOTED,
];

// arabic labels for the case state
export const pleadingStateLabels = {
  DRAFT: "مسودة",
  REQUESTED: "بانتظار رد المستشار",
  QUOTED: "تم تحديد السعر",
  PAID: "مدفوع",
  DECLINED: "مرفوض",
  EXPIRED: "منتهي",
  CANCELED: "ملغي",
} satisfies Record<PleadingState, string>;

// why a case chat is read-only, by state (open states have none)
export const pleadingClosedNotes: Partial<Record<PleadingState, string>> = {
  DRAFT: "لم يكتمل إرسال الطلب بعد.",
  PAID: "تم دفع قيمة الجلسة، وتُستكمل المحادثة في محادثة الجلسة.",
  DECLINED: "اعتذر المستشار عن هذا الطلب، وتم إغلاق المحادثة.",
  EXPIRED: "انتهت صلاحية هذا الطلب، وتم إغلاق المحادثة.",
  CANCELED: "ألغى العميل هذا الطلب، وتم إغلاق المحادثة.",
};

// shown while a payment of the quote is in progress (every case action waits for it)
export const pleadingCheckoutNote =
  "العميل في مرحلة الدفع الآن، لا يمكن تعديل العرض أو الاعتذار أو الإلغاء حتى تنتهي عملية الدفع.";

// arabic messages for the pleading actions' own error codes (pass to useAction's errors)
export const pleadingErrors = {
  not_found: "الطلب غير موجود",
  unavailable: "هذا المستشار لا يستقبل طلبات المرافعة حالياً",
  contact_info: "عفواً، لا يُسمح بتبادل وسائل التواصل الخارجي أو الروابط.",
  closed: "تم إغلاق هذه المحادثة",
  empty_message: "اكتب رسالة أو أرفق ملفاً",
  invalid_state: "لا يمكن تنفيذ هذا الإجراء في حالة الطلب الحالية",
  checkout_in_progress: "عملية الدفع قيد التنفيذ بالفعل",
  not_law: "طلبات المرافعة متاحة للمستشارين القانونيين فقط",
} as const;

// bot_detected is a base code (types/action.d.ts, message in baseActionErrors) that
// lib/safe-action's own base list doesn't include yet
export type PleadingError = keyof typeof pleadingErrors | "bot_detected";

// true while the client can still book and pay the quote
export const isQuoteOpen = (
  p: { state: PleadingState; price: number | null; expiresAt: Date | null },
  now: Date = new Date(),
) =>
  p.state === PleadingState.QUOTED &&
  p.price !== null &&
  p.expiresAt !== null &&
  p.expiresAt.getTime() > now.getTime();

// true while both sides can write in the case chat
export const isPleadingChatOpen = (state: PleadingState) =>
  PLEADING_OPEN_STATES.includes(state);

// the quote as it's posted in the case chat (the price line is written by the server)
export const pleadingQuoteMessage = (price: number, reply: string) =>
  `عرض السعر: ${price} ريال (قبل الضريبة)\n\n${reply}`;

// the consultant's reply inside a quote message (the text after the server's price line)
export const pleadingQuoteReply = (content: string) =>
  content.startsWith("عرض السعر:")
    ? content.slice(content.indexOf("\n\n") + 2)
    : content;

// the consultant's decline as it's posted in the case chat, with their optional reason
export const pleadingDeclineMessage = (reason?: string | null) => {
  const text = "اعتذر المستشار عن قبول طلب المرافعة.";
  const why = reason?.trim();
  return why ? `${text}\n\n${why}` : text;
};

// files must come from our upload flow (the uploadthing hosts next/image allows, as in schemas/center.ts)
const UPLOAD_HOSTS = ["utfs.io", "huqzhdqiy3.ufs.sh"];

// case chat files: images, pdf and word (.docx). the picker, the upload endpoint and the
// message schema all use this list
export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const PLEADING_FILE_ACCEPT = `image/*,application/pdf,.docx,${DOCX_MIME}`;

export const pleadingFileSchema = z
  .object({
    url: z
      .string()
      .trim()
      .url()
      .refine((v) => {
        try {
          const u = new URL(v);
          return u.protocol === "https:" && UPLOAD_HOSTS.includes(u.hostname);
        } catch {
          return false;
        }
      }),
    name: z.string().trim().min(1).max(200),
    type: z
      .string()
      .trim()
      .refine(
        (t) =>
          /^image\/[a-z0-9.+-]+$/.test(t) ||
          t === "application/pdf" ||
          t === DOCX_MIME,
      ),
  })
  // a word file must also be named .docx
  .refine((f) => f.type !== DOCX_MIME || /\.docx$/i.test(f.name));

export type PleadingFile = z.infer<typeof pleadingFileSchema>;

// the client's link token: exactly what newClientToken() makes
export const clientTokenSchema = z
  .string()
  .regex(/^[A-Za-z0-9_-]{43}$/);

const plid = z.number().int().positive();
const content = z.string().trim().max(2000, "الرسالة طويلة جداً");

// request form (step 1): the brief becomes the case chat's first message
export const pleadingRequestSchema = z.object({
  cid: z.number().int().positive(),
  name: schemas.name,
  // digits only, as the booking form sends it (phoneNumber in utils)
  phone: z
    .string()
    .transform((v) => v.replace(/\D/g, ""))
    .pipe(schemas.phone),
  brief: z
    .string()
    .trim()
    .min(20, "اكتب ملخص القضية في 20 حرفاً على الأقل")
    .max(4000, "4000 حرف كحد أقصى"),
});

// request form (step 2): the uploaded files, then the case goes to the consultant
export const pleadingFinalizeSchema = z.object({
  token: clientTokenSchema,
  files: z.array(pleadingFileSchema).max(PLEADING_MAX_FILES).default([]),
});

// a case chat message: text, a file, or both
export const pleadingClientMessageSchema = z.object({
  token: clientTokenSchema,
  content: content.default(""),
  file: pleadingFileSchema.nullish(),
});

export const pleadingOwnerMessageSchema = z.object({
  plid,
  content: content.default(""),
  file: pleadingFileSchema.nullish(),
});

// the consultant's quote: the reply and a pre-vat whole price
export const pleadingQuoteSchema = z.object({
  plid,
  reply: z.string().trim().min(1, "اكتب ردك على العميل").max(2000),
  price: z
    .number()
    .int("السعر رقم صحيح بدون كسور")
    .min(PLEADING_MIN_PRICE, `السعر ${PLEADING_MIN_PRICE} ريال على الأقل`)
    .max(PLEADING_MAX_PRICE, `السعر ${PLEADING_MAX_PRICE} ريال كحد أقصى`),
});

// the consultant's decline, with an optional reason for the client
export const pleadingDeclineSchema = z.object({
  plid,
  reason: z.string().trim().max(500, "500 حرف كحد أقصى").nullish(),
});

export const pleadingTokenSchema = z.object({ token: clientTokenSchema });

export const pleadingToggleSchema = z.object({ enabled: z.boolean() });

// checkout (used from phase 5): no price, coupon or discount fields exist on purpose
export const pleadingCheckoutSchema = z.object({
  token: clientTokenSchema,
  date: z.coerce.date({ required_error: "التاريخ مطلوب" }),
  time: z.string({ required_error: "الوقت مطلوب" }).min(1, "الوقت مطلوب"),
  method: z.nativeEnum(PaymentMethod, {
    required_error: "برجاء اختيار طريقة دفع",
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: "يجب قبول الشروط والأحكام" }),
  }),
});
