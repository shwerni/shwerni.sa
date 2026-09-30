"use server";

// hotfix wrappers: same signatures and return shapes as data/order/reserveation.ts, which is now server-only

// prisma data
import {
  getPaidOwnersOrdersByAuthorAndMonth as getPaidOwnersOrdersByAuthorAndMonthData,
  getPaidPast3Days as getPaidPast3DaysData,
} from "@/data/order/reserveation";

// lib
import { isConsultant, sessionUser } from "@/lib/auth/guards";

// refunds are handled only in the separate dashboard codebase, never on this site.
// the order-card refund button points here: every call is rejected, so the button
// shows its existing error message. the pid argument is never read.
export async function orderStatusRefund(_pid: string) {
  return false;
}

// own consultant only; the author argument is ignored
export async function getPaidOwnersOrdersByAuthorAndMonth(
  ...[, range]: Parameters<typeof getPaidOwnersOrdersByAuthorAndMonthData>
) {
  const user = await sessionUser();
  if (!user || !(await isConsultant())) return null;
  return getPaidOwnersOrdersByAuthorAndMonthData(user.id, range);
}

// public: recent paid orders for the home page notification
export async function getPaidPast3Days() {
  return getPaidPast3DaysData();
}
