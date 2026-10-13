import "server-only";

// packages
import { timingSafeEqual } from "crypto";

// dashboard → site calls: "Authorization: Bearer <DASHBOARD_SECRET>", compared in constant time.
// an unset secret never matches, and different lengths are refused before the compare
// (timingSafeEqual throws on them)
export function verifyDashboardSecret(request: Request): boolean {
  const expected = Buffer.from(process.env.DASHBOARD_SECRET ?? "");
  if (!expected.length) return false;

  const header = request.headers.get("authorization") ?? "";
  if (!header.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice("Bearer ".length));
  if (provided.length !== expected.length) return false;

  return timingSafeEqual(provided, expected);
}
