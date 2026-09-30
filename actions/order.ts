"use server";

// hotfix wrappers: same signatures and return shapes as data/order/reserveation.ts, which is now server-only

// prisma data
import {
  getPaidOwnersOrdersByAuthorAndMonth as getPaidOwnersOrdersByAuthorAndMonthData,
  getPaidPast3Days as getPaidPast3DaysData,
} from "@/data/order/reserveation";

// lib
import { isConsultant, sessionUser } from "@/lib/auth/guards";

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
