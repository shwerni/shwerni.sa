import "server-only";

// packages
import { timingSafeEqual } from "node:crypto";

// true only for vercel cron's "Authorization: Bearer <CRON_SECRET>" header.
// an unset or empty CRON_SECRET rejects every request, so "Bearer undefined" never passes.
export function isCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  // timingSafeEqual throws on different lengths
  return provided.length === expected.length && timingSafeEqual(provided, expected);
}
