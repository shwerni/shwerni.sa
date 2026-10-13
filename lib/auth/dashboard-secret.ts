import "server-only";

// packages
import { timingSafeEqual } from "crypto";

// dashboard → site calls: the x-dashboard-secret header must equal DASHBOARD_SECRET, compared in
// constant time. an unset secret never matches, and different lengths are refused before the
// compare (timingSafeEqual throws on them)
export function verifyDashboardSecret(request: Request): boolean {
  const provided = Buffer.from(request.headers.get("x-dashboard-secret") ?? "");
  const expected = Buffer.from(process.env.DASHBOARD_SECRET ?? "");

  if (!expected.length || provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}
