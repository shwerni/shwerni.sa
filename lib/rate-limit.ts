import "server-only";

// React & Next
import { headers } from "next/headers";

// lib
import prisma from "@/lib/database/db";

export type RateWindow = `${number} ${"s" | "m" | "h" | "d"}`;
export type RateLimitConfig = { limit: number; window: RateWindow };

const UNIT_SECONDS = { s: 1, m: 60, h: 3600, d: 86400 } as const;

// must match the cleanup cron interval
const MAX_WINDOW_SECONDS = 86400;

// a slow counter must never block a real request
const TIMEOUT_MS = 800;

function toSeconds(window: RateWindow): number {
  const [amount, unit] = window.split(" ") as [string, keyof typeof UNIT_SECONDS];
  const seconds = Number(amount) * UNIT_SECONDS[unit];

  if (!Number.isFinite(seconds) || seconds <= 0 || seconds > MAX_WINDOW_SECONDS) {
    throw new Error(`invalid rate limit window: ${window}`);
  }

  return seconds;
}

// one atomic round trip: insert, increment, or reset if the window expired
async function hit(key: string, windowSeconds: number): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: number }[]>`
    INSERT INTO rate_limit (key, count, window_start)
    VALUES (${key}, 1, now())
    ON CONFLICT (key) DO UPDATE SET
      count = CASE
        WHEN rate_limit.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN 1 ELSE rate_limit.count + 1 END,
      window_start = CASE
        WHEN rate_limit.window_start <= now() - make_interval(secs => ${windowSeconds}::double precision)
        THEN now() ELSE rate_limit.window_start END
    RETURNING count
  `;

  return rows[0]?.count ?? 1;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error("rate limit timeout")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// true if the request is allowed; fails open on errors or timeouts
export async function rateLimit(key: string, { limit, window }: RateLimitConfig): Promise<boolean> {
  try {
    const count = await withTimeout(hit(key, toSeconds(window)), TIMEOUT_MS);
    return count <= limit;
  } catch (err) {
    console.error("[rate-limit]", key, err);
    return true;
  }
}

// ipv6 users can rotate through a whole /64 block, so ipv6 is bucketed by /64; ipv4 is used as is
function normalizeIp(ip: string): string {
  // ipv4
  if (!ip.includes(":")) return ip;

  // ipv4-mapped ipv6
  if (ip.includes(".")) return ip.slice(ip.lastIndexOf(":") + 1);

  const [head, tail] = ip.split("::");
  const headParts = head ? head.split(":") : [];
  const tailParts = tail ? tail.split(":") : [];
  const full =
    tail !== undefined
      ? [...headParts, ...Array(8 - headParts.length - tailParts.length).fill("0"), ...tailParts]
      : headParts;

  return `${full
    .slice(0, 4)
    .map((part) => part.toLowerCase().replace(/^0+(?=.)/, ""))
    .join(":")}::/64`;
}

export async function getClientIp(): Promise<string> {
  const h = await headers();

  // x-real-ip is set by vercel from the real connection and can't be spoofed by the client
  const raw = h.get("x-real-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim();

  return raw ? normalizeIp(raw) : "unknown";
}

// run in psql supabase
// select cron.schedule(
//   'rate-limit-cleanup',
//   '*/30 * * * *',
//   $$DELETE FROM rate_limit WHERE window_start < now() - interval '1 day'$$
// );