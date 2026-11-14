// packages
import { z } from "zod";
import type { User } from "next-auth";

// utils
import { rateLimit } from "@/lib/rate-limit";
import { HttpError } from "@/lib/api/http-error";
import { SendChatBot } from "@/lib/api/ai/chat-bot";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// prisma data
import { BOT_DAILY_LIMIT } from "@/data/admin/bot";
import { accountPhone } from "@/data/mobile/booking";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

const BotSchema = z.object({ message: z.string().trim().min(1).max(500) });

// a burst guard on top of the daily cap (its message is shown as the bot's answer)
const BURST_MESSAGE = "أرسلت رسائل كثيرة خلال دقيقة، انتظر قليلًا ثم حاول مرة أخرى.";

// the support bot (مساعد شاورني الذكي): the website's SendChatBot with its signed-in daily cap
// (user:<id>, BOT_DAILY_LIMIT) and the account's own phone and name; never a phone or a user
// from the body. messages are stored like the website's bot (by phone)
export const POST = createPostRoute<{ reply: string }>(async (request) => {
  const session = await requireMobileUser(request);

  const parsed = BotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

  if (!(await rateLimit(`bot-burst:${session.id}`, { limit: 10, window: "1 m" }))) {
    throw new HttpError(BURST_MESSAGE, 429, { message: BURST_MESSAGE });
  }

  // the chat is keyed by the account's phone (the website's signed-in bot does the same)
  const phone = (await accountPhone(session.id)) ?? `user:${session.id}`;
  const user = {
    id: session.id,
    name: session.name ?? null,
    phone,
    role: UserRole.USER,
  } as User;

  const reply = await SendChatBot(
    { key: `user:${session.id}`, limit: BOT_DAILY_LIMIT },
    parsed.data.message,
    phone,
    user,
  );
  return { reply: String(reply ?? "") };
});
