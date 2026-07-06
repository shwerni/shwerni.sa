"use server";
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

export async function getHomeStatistics() {
  try {
    // thirty days ago month
    const month = subDays(new Date(), 45);

    // order monthly
    const monthly = await prisma.order.count({
      where: {
        payment: { payment: PaymentState.PAID },
        created_at: {
          gte: month,
        },
      },
    });

    // consultant counts
    const consultants = await prisma.consultant.count({
      where: {
        approved: ApprovalState.APPROVED,
        statusA: ConsultantState.PUBLISHED,
        status: true,
      },
    });

    // orders count
    const orders = await prisma.order.count();

    return { consultants, orders, monthly };
  } catch {
    return null;
  }
}

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
