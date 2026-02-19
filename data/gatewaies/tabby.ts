"use server";
// prisma db
import prisma from "@/lib/database/db";

// utils
import { totalAfterTax } from "@/utils";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// constants
import { mainRoute } from "@/constants/links";

// tabby payment status
const tabbyPaymentStatus = (status: string): string => {
  const statusMapping: Record<string, string> = {
    PROCESSING: "processing",
    HOLD: "new",
    PAID: "complete",
    REFUND: "refunded",
    REFUSED: "unknown",
    CANCELED: "canceled",
  };
  // return
  return statusMapping[status] || "unknown";
};

// tabby order history
export const getTabbyOrderHistory = async (oid: number, author: string) => {
  try {
    // orders
    const orders = await prisma.order.findMany({
      take: 5,
      orderBy: {
        created_at: "desc",
      },
      where: { oid: { not: oid }, author },
      select: {
        consultantId: true,
        name: true,
        phone: true,
        consultant: true,
        created_at: true,
        payment: {
          select: {
            tax: true,
            total: true,
            payment: true,
            method: true,
          },
        },
      },
    });

    // order history
    const history = orders
      .filter((o) => o.payment)
      .map((order) => {
        const payment = order.payment!;
        return {
          purchased_at: order.created_at,
          amount: totalAfterTax(payment!.total, payment!.tax),
          payment_method: "card",
          status: tabbyPaymentStatus(payment!.payment),
          buyer: {
            phone: order.phone,
            name: order.name,
          },
          items: [
            {
              title: order.consultant,
              description: order.consultant,
              quantity: 1,
              unit_price: totalAfterTax(payment!.total, payment!.tax),
              reference_id: String(order.consultantId),
              product_url: `${mainRoute}consultant/${order.consultantId}`,
            },
          ],
        };
      });
    return history;
  } catch {
    return null;
  }
};

// buyer history loyalty level (success paid orders)
export const getTabbyBuyerLoyalty = async (author: string) => {
  try {
    const orders = await prisma.order.count({
      where: { author, payment: { payment: PaymentState.PAID } },
    });
    // success paid orders by this author
    return orders;
  } catch {
    return null;
  }
};

// tabby buyer registered date
export const getTabbyRegisteredDate = async (id: string) => {
  try {
    // get user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, created_at: true },
    });
    // return date
    return user;
  } catch {
    return null;
  }
};
