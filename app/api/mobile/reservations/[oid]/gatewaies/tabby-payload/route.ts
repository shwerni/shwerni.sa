"use server";

// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";
import { zencryption } from "@/utils/admin/encryption";
import { Reservation } from "@/types/admin";
import { tabbyBody } from "@/lib/api/gatewaies/tabby";

export const POST = createPostRoute<
  { state: boolean; message?: string; payload?: object },
  { oid: string }
>(async (request: NextRequest, context) => {
  const user = await requireMobileUser(request);
  const { oid } = await context.params;

  const order = await prisma.order.findFirst({
    where: { oid: Number(oid), author: user.id },
    include: { payment: true, consultant: { select: { name: true } } },
  });

  if (!order?.payment) {
    return { state: false, message: "الطلب غير موجود" };
  }

  const zid = zencryption(order.oid);
  const payload = await tabbyBody(
    order as Reservation,
    String(order.payment.total),
    zid,
  );

  return {
    state: true,
    payload: {
      ...payload.payment,
      shipping_address: { city: "", address: "", zip: "" },
    },
  };
});
