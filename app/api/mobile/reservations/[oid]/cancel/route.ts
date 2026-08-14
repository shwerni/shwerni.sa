// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/browser";

export const POST = createPostRoute<{ state: boolean }, { oid: string }>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { oid } = await context.params;

    const order = await prisma.order.findFirst({
      where: { oid: Number(oid), author: user.id },
      select: { payment: { select: { id: true } } },
    });

    if (!order?.payment) {
      return { state: false };
    }

    // count stays 0, and it's atomic against a concurrent confirm request
    const result = await prisma.payment.updateMany({
      where: { id: order.payment.id, payment: PaymentState.NEW },
      data: { payment: PaymentState.CANCELED, cancelled_at: new Date() },
    });

    return { state: result.count > 0 };
  },
);