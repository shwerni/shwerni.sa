"use server";

// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

// lib
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import { isMoyasarSettledPaid } from "@/utils/gatewaies";

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET!;

export const POST = createPostRoute<
  { state: boolean; message?: string; oid?: number },
  { oid: string }
>(async (request: NextRequest, context) => {
  const user = await requireMobileUser(request);
  const { oid } = await context.params;
  const { pid } = await request.json();

  const order = await prisma.order.findFirst({
    where: { oid: Number(oid), author: user.id },
    select: { payment: { select: { id: true, pid: true } } },
  });

  if (!order?.payment) {
    return { state: false, message: "الطلب غير موجود" };
  }

  // first confirm for this order — the sdk-charged pid is only known now,
  // save it so a retry/duplicate confirm can be matched against it below
  if (!order.payment.pid) {
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { pid },
    });
  } else if (order.payment.pid !== pid) {
    return { state: false, message: "بيانات الدفع غير متطابقة" };
  }

  // native sdk pids are payment ids, not invoice ids — query the payments
  // endpoint directly rather than moyasarPaymentStatus, which is built
  // around MOYASAR_ENDPOINT (the invoices resource used by web checkout)
  const res = await fetch(`https://api.moyasar.com/v1/payments/${pid}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64")}`,
    },
  });

  if (!res.ok) {
    return { state: false, message: "تعذر التحقق من حالة الدفع" };
  }

  const moyasar = await res.json();

  if (!isMoyasarSettledPaid(moyasar.status)) {
    return { state: false, message: "لم يتم تأكيد الدفع بعد" };
  }

  await updateOrderStatus(pid, PaymentState.PAID);

  return { state: true, oid: Number(oid) };
});