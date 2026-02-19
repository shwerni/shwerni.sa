// prisma data
import prisma from "@/lib/database/db";

// pacakge
import { startOfDay } from "date-fns";

// limit
const limit = 15;

export async function checkBotLimit(phone: string) {
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
