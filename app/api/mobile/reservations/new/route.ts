// React & Next
import { NextRequest, NextResponse } from "next/server";

// prisma db
import prisma from "@/lib/database/db";

// gateway

// actions — reused as-is from web's reservation flow

// utils

// prisma types
import { PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";
import { CheckIsBlocked } from "@/data/blocked";
import { reserveConsultant } from "@/data/order/reserveation";
import { saveACoupon } from "@/data/coupon";
import { moyasarPaymentStatus } from "@/lib/api/gatewaies/moyasar";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { onPaymentSuccess } from "@/handlers/admin/order/payment";

/**
 * moyasar's raw status string to the internal PaymentState enum
 */
export function mapMoyasarStatus(status: string): PaymentState {
  switch (status) {
    case "paid":
      return PaymentState.PAID;
    case "failed":
      return PaymentState.REFUSED;
    case "authorized":
    case "initiated":
      return PaymentState.PROCESSING;
    case "captured":
      return PaymentState.PAID;
    case "refunded":
    case "partially_refunded":
      return PaymentState.REFUND;
    case "voided":
      return PaymentState.CANCELED;
    default:
      return PaymentState.HOLD;
  }
}

export async function POST(request: NextRequest) {
  // throws a 401 HttpError on an invalid/missing session
  const user = await requireMobileUser(request);

  const raw = await request.json();
  const data = { ...raw, user: user.id };

  const isBlocked = await CheckIsBlocked(data.phone);
  if (isBlocked) {
    return NextResponse.json({ state: false, message: "هذا الحساب محظور" });
  }

  // mobile currently only supports consultant reservations
  if (data.order !== "consultant") {
    return NextResponse.json({ state: false, message: "نوع الحجز غير مدعوم" });
  }

  const total = data.cost[data.duration] * data.sessions;

  // reuses web's exact order-creation logic — order starts as PaymentState.NEW,
  // same abandonment trail web already keeps if payment never completes
  const result = await reserveConsultant(data, total);

  if (!result || result.state === false) return;
  const order = result.order;

  if (!order || !order.payment) {
    return NextResponse.json({ state: false, message: "حدث خطأ ما" });
  }

  if (data.couponPercent && data.couponCode) {
    await saveACoupon(data.user, data.couponCode, order.payment.id);
  }

  // mobile already ran the moyasar sdk charge client-side and reports a pid —
  // that report is never trusted on its own, status is re-fetched directly
  // from moyasar before treating the order as paid
  const status = await moyasarPaymentStatus(data.pid);
  const paymentState = mapMoyasarStatus(status);

  if (paymentState !== PaymentState.PAID) {
    // order remains recorded as NEW — mirrors web's behavior for abandoned payments
    return NextResponse.json({ state: false, message: "الدفع لم يكتمل بنجاح" });
  }

  const confirmed = await prisma.order.update({
    where: { oid: order.oid },
    data: {
      payment: {
        update: {
          pid: data.pid,
          method: PaymentMethod.visaMoyasar,
          payment: PaymentState.PAID,
          paid: total,
        },
      },
    },
    include: {
      payment: true,
      meeting: { include: { participants: true } },
      consultant: { select: { userId: true, name: true, phone: true } },
    },
  });

  // room creation + notifications, reused as-is from web
  await onPaymentSuccess(confirmed);

  return NextResponse.json({ state: true, oid: confirmed.oid });
}
