"use server";

// hotfix wrappers: same signatures and return shapes as the server-only originals

// lib
import { aiConsultantSummary as aiConsultantSummaryApi } from "@/lib/api/ai/ai";
import { SendChatBot as SendChatBotApi } from "@/lib/api/ai/chat-bot";
import { verifyRecaptcha as verifyRecaptchaApi } from "@/lib/api/recaptcha";
import { isConsultant, sessionUser } from "@/lib/auth/guards";

// consultants only (paid ai call)
export async function aiConsultantSummary(
  ...args: Parameters<typeof aiConsultantSummaryApi>
) {
  if (!(await isConsultant())) return ["", "", ""];
  return aiConsultantSummaryApi(...args);
}

// public chat bot; the user argument comes from the session, never from the caller
export async function SendChatBot(
  ...[message, from, , consultant]: Parameters<typeof SendChatBotApi>
) {
  const user = await sessionUser();
  return SendChatBotApi(message, from, user ?? undefined, consultant);
}

// public; reCAPTCHA is removed later in favour of BotID
export async function verifyRecaptcha(
  ...args: Parameters<typeof verifyRecaptchaApi>
) {
  return verifyRecaptchaApi(...args);
}
