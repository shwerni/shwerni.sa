import { sendWhatsappText } from "@/lib/api/whatsapp";
import { createGoogleMeeting } from "@/lib/api/google";

interface SpecialReplyContext {
  phone: string;
  text: string;
}

type SpecialReplyRule = {
  matches: (ctx: SpecialReplyContext) => boolean;
  handle: (ctx: SpecialReplyContext) => Promise<void>;
};

const GOOGLE_MEET_NUMBERS = new Set(["966554117879", "201222166530"]);
const GOOGLE_MEET_TRIGGER = "رابط اجتماع";

// Each rule fully owns the message: if `matches` is true, `handle` runs
// and NO further processing happens (no enqueue, no AI reply).
const specialReplyRules: SpecialReplyRule[] = [
  {
    matches: ({ phone, text }) =>
      GOOGLE_MEET_NUMBERS.has(phone) && text === GOOGLE_MEET_TRIGGER,
    handle: async ({ phone }) => {
      const url = await createGoogleMeeting();
      await sendWhatsappText(phone, url ?? "خلل في انشاء الرابط");
    },
  },
  {
    matches: ({ phone }) => phone === "201227502703",
    handle: async ({ phone }) => {
      await sendWhatsappText(phone, "بحب يا جنتي ❤️");
    },
  },

  // Add more special-case rules here, e.g.:
  // {
  //   matches: ({ phone, text }) => phone === "xxxxx" && text === "كلمة معينة",
  //   handle: async ({ phone }) => { await sendWhatsappText(phone, "رد مخصص"); },
  // },
];

/**
 * Runs all special-reply rules in order. If one matches, its handler
 * fires and this returns true — the caller must stop processing this
 * message entirely (no enqueue, no debounce, no AI call).
 * Returns false if nothing matched, meaning normal flow should continue.
 */
export async function handleSpecialReply(
  ctx: SpecialReplyContext,
): Promise<boolean> {
  for (const rule of specialReplyRules) {
    if (rule.matches(ctx)) {
      await rule.handle(ctx);
      return true;
    }
  }
  return false;
}