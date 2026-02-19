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
}
