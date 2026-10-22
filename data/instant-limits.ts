import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { OrderType } from "@/lib/generated/prisma/enums";

// constants
import {
  INSTANT_LIMIT_PER_IP,
  INSTANT_LIMIT_PER_PHONE,
  INSTANT_LIMIT_WINDOW_MS,
  instantIpRateKey,
} from "@/constants/instant";

/**
 * may this phone and ip create one more instant order? only created orders count: the phone's
 * INSTANT orders of the last INSTANT_LIMIT_WINDOW_MS, and the ip's rate_limit counter, which is
 * read here (never incremented) and incremented only once an order is created (Pay). fails open,
 * like lib/rate-limit.ts: a slow or broken counter never blocks a real booking
 */
export async function instantOrderAllowed(ip: string, phone: string): Promise<boolean> {
  const windowSeconds = INSTANT_LIMIT_WINDOW_MS / 1000;
  try {
    const [byIp, byPhone] = await Promise.all([
      prisma.$queryRaw<{ count: number }[]>`
        SELECT count FROM rate_limit
        WHERE key = ${instantIpRateKey(ip)}
          AND window_start > now() - make_interval(secs => ${windowSeconds}::double precision)
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) AS count FROM orders o
        WHERE o.type = ${OrderType.INSTANT}::"OrderType"
          AND o.phone = ${phone}
          AND o.created_at > now() - make_interval(secs => ${windowSeconds}::double precision)
      `,
    ]);

    return (
      (byIp[0]?.count ?? 0) < INSTANT_LIMIT_PER_IP &&
      Number(byPhone[0]?.count ?? 0) < INSTANT_LIMIT_PER_PHONE
    );
  } catch (err) {
    console.error("[instant-limits]", err);
    return true;
  }
}
