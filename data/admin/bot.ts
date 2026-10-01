// prisma data
import prisma from "@/lib/database/db";

// pacakge
import { startOfDay } from "date-fns";

// daily message caps: whatsapp senders and logged-in web users
export const BOT_DAILY_LIMIT = 15;
// web guests are keyed per ip, so everyone behind one address shares this
export const GUEST_BOT_DAILY_LIMIT = 50;

export async function checkBotLimit(phone: string, limit = BOT_DAILY_LIMIT) {
  // now
  const now = new Date();

  // start of day
  const today = startOfDay(now);

  const usage = await prisma.botUsage.upsert({
    where: {
      phone_date: {
        phone,
        date: today,
      },
    },
    update: {
      count: { increment: 1 },
    },
    create: {
      phone,
      date: today,
      count: 1,
    },
  });

  if (usage.count > limit) return false;

  return true;
}
