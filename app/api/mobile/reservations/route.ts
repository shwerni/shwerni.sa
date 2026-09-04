"use server";

// React & Next
import { NextResponse, type NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";

// actions — reused as-is from web
import { CheckIsBlocked } from "@/data/blocked";
import { saveACoupon } from "@/data/coupon";
import { reserveConsultant } from "@/data/order/reserveation";

// prisma types
import { OrderOrigin } from "@/lib/generated/prisma/enums";
import { PaymentState } from "@/lib/generated/prisma/browser";

// an abandoned NEW order older than this no longer holds the slot
const PENDING_ORDER_TTL_MINUTES = 15;
// generous for legitimate retries, tight enough to make order-spam pointless
const MAX_ORDERS_PER_WINDOW = 10;
const RATE_WINDOW_MINUTES = 10;

export async function POST(request: NextRequest) {
  const user = await requireMobileUser(request);

  const raw = await request.json();
  const data = { ...raw, user: user.id };

  const isBlocked = await CheckIsBlocked(data.phone);
  if (isBlocked) {
    return NextResponse.json({ state: false, message: "هذا الحساب محظور" });
  }

  if (data.order !== "consultant") {
    return NextResponse.json({ state: false, message: "نوع الحجز غير مدعوم" });
  }

  const recentCount = await prisma.order.count({
    where: {
      author: user.id,
      created_at: { gte: new Date(Date.now() - RATE_WINDOW_MINUTES * 60_000) },
    },
  });

  if (recentCount >= MAX_ORDERS_PER_WINDOW)
    return NextResponse.json({
      state: false,
      message: "عدد كبير من المحاولات، حاول لاحقاً",
    });

  // reuse an in-flight order for the same slot instead of creating a
  // duplicate — covers back+retry taps, double taps, and app relaunches.
  // assumes reserveConsultant creates the meeting row up front to lock
  // the slot, even before payment — confirm this holds true
  const existing = await prisma.order.findFirst({
    where: {
      author: user.id,
      consultantId: data.cid,
      payment: { is: { payment: PaymentState.NEW } },
      created_at: {
        gte: new Date(Date.now() - PENDING_ORDER_TTL_MINUTES * 60_000),
      },
      meeting: { some: { date: data.date, time: data.time } },
    },
    include: { payment: true },
  });

  if (existing && existing.payment) {
    return NextResponse.json({
      state: true,
      oid: existing.oid,
      paymentId: existing.payment.id,
      total: existing.payment.total,
    });
  }

  const total = data.cost[data.duration] * data.sessions;

  // order starts as PaymentState.NEW, exactly like web — oid is available
  // immediately, before any payment attempt happens
  const result = await reserveConsultant(data, total, OrderOrigin.APP);

  if (!result || result.state === false) return;
  const order = result.order;
  
  if (!order || !order.payment) {
    return NextResponse.json({ state: false, message: "حدث خطأ ما" });
  }

  if (data.couponPercent && data.couponCode) {
    await saveACoupon(data.user, data.couponCode, order.payment.id);
  }

  return NextResponse.json({
    state: true,
    oid: order.oid,
    paymentId: order.payment.id,
    total,
  });
}
