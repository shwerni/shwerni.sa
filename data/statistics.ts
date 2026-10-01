import "server-only";
// packages
import { subDays } from "date-fns";

// prisma
import prisma from "@/lib/database/db";

// prisma types
import {
  ApprovalState,
  ConsultantState,
  PaymentState,
} from "@/lib/generated/prisma/enums";

export async function getHomeSecondaryStatistics() {
  try {
    // total paid orders
    const paidOrders = await prisma.order.count({
      where: {
        payment: { payment: PaymentState.PAID },
      },
    });

    // total meeting minutes across paid orders
    const meetings = await prisma.meeting.findMany({
      where: {
        orders: { payment: { payment: PaymentState.PAID } },
      },
      select: { duration: true },
    });

    const totalMinutes = meetings.reduce((sum, m) => {
      const parsed = parseInt(m.duration, 10);
      return sum + (Number.isNaN(parsed) ? 0 : parsed);
    }, 0);

    // average review rating (out of 5)
    const reviewAgg = await prisma.review.aggregate({
      _avg: { rate: true },
    });

    const avgRate = reviewAgg._avg.rate ?? 0;

    return { paidOrders, totalMinutes, avgRate };
  } catch {
    return null;
  }
}
