import "server-only";

// packages
import { timingSafeEqual } from "crypto";

// site → site (and realtime server → site) internal calls: the x-internal-secret header must equal
// INTERNAL_SHARED_SECRET, compared in constant time. an unset secret never matches, and different
// lengths are refused before the compare (timingSafeEqual throws on them)
export const INTERNAL_SECRET_HEADER = "x-internal-secret";

export function verifyInternalSecret(request: Request): boolean {
  const provided = Buffer.from(request.headers.get(INTERNAL_SECRET_HEADER) ?? "");
  const expected = Buffer.from(process.env.INTERNAL_SHARED_SECRET ?? "");

  if (!expected.length || provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
