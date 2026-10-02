"use server";

// hotfix wrappers: same signatures and return shapes as the server-only originals

// prisma data
import { BOT_DAILY_LIMIT, GUEST_BOT_DAILY_LIMIT } from "@/data/admin/bot";

// lib
import { aiConsultantSummary as aiConsultantSummaryApi } from "@/lib/api/ai/ai";
import { SendChatBot as SendChatBotApi } from "@/lib/api/ai/chat-bot";
import { isConsultant, sessionUser } from "@/lib/auth/guards";
import { checkHuman } from "@/lib/bot-protection";
import { getClientIp } from "@/lib/rate-limit";

// consultants only (paid ai call)
export async function aiConsultantSummary(
  ...args: Parameters<typeof aiConsultantSummaryApi>
) {
  if (!(await isConsultant())) return ["", "", ""];
  return aiConsultantSummaryApi(...args);
}

// public chat bot; the user argument comes from the session, never from the caller.
// the daily cap is keyed on the session user (15), or the client ip for guests (50): from is
// caller-supplied (a localStorage id), so it still names the chat but never counts usage
export async function SendChatBot(
  message: string,
  from: string,
  _user?: unknown,
  consultant?: Parameters<typeof SendChatBotApi>[4],
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("SendChatBot"))) return "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى.";
  const user = await sessionUser();
  const cap = user
    ? { key: `user:${user.id}`, limit: BOT_DAILY_LIMIT }
    : { key: `ip:${await getClientIp()}`, limit: GUEST_BOT_DAILY_LIMIT };
  return SendChatBotApi(cap, message, from, user ?? undefined, consultant);
}

