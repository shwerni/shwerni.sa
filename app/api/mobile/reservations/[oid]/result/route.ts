// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";
import { isMoyasarSettledPaid, isMoyasarDefinitiveFailure } from "@/utils/gatewaies";
import { acceptedGatewayAmounts } from "@/utils/tax";
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

const MOYASAR_SECRET_KEY = process.env.MOYASAR_SECRET!;

interface PaymentResultResponse {
  oid: number;
  status: "success" | "pending" | "failed";
  amountSar: number;
  consultantName: string;
  consultantImage: string | null;
  date: string | undefined;
  time: string | undefined;
  failureReason: string | null;
}

/**
 * verify a payment server-to-server and return a safe order dto
 * never trusts the client-reported status, always re-checks with moyasar
 */
export const GET = createGetRoute<PaymentResultResponse, { oid: string }>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { oid } = await context.params;

    const order = await prisma.order.findFirst({
      where: { oid: Number(oid), author: user.id },
      include: {
        payment: true,
        meeting: { select: { time: true, date: true } },
        consultant: { select: { name: true, image: true } },
      },
    });

    if (!order?.payment) {
      throw new Error("order_not_found");
    }

    let state = order.payment.payment;
    let failureReason: string | null = null;

    // only re-hit moyasar if we haven't settled this order yet
    if (state === PaymentState.NEW && order.payment.pid) {
      const res = await fetch(
        `https://api.moyasar.com/v1/payments/${order.payment.pid}`,
        {
          headers: {
            Authorization: `Basic ${Buffer.from(`${MOYASAR_SECRET_KEY}:`).toString("base64")}`,
          },
        },
      );

      const moyasar = await res.json();

      // verify against our own recorded total, and against the oid this
      // payment was created for — comparing moyasar's own fields to each
      // other proves nothing about whether the order actually matches
      // same tax-inclusive charge as web, in halalas: the card's part (the app's wallet part is
      // debited at PAID). remove after 2026-10-09: pre-cutoff orders also accept the old formulas
      const amountMatches = acceptedGatewayAmounts(order.payment, order.created_at)
        .map((total) => Math.round(total * 100))
        .includes(moyasar.amount);
      const oidMatches = moyasar.metadata?.oid === order.oid;

      const currencyMatches = moyasar.currency === "SAR";
      let settled: PaymentState | null = null;
      if (
        isMoyasarSettledPaid(moyasar.status) &&
        amountMatches &&
        currencyMatches &&
        oidMatches
      ) {
        settled = PaymentState.PAID;
      } else if (isMoyasarDefinitiveFailure(moyasar.status)) {
        settled = PaymentState.REFUSED;
        failureReason = moyasar.source?.message ?? null;
      }

      // through the one status path (CLAUDE.md): PAID runs the meeting, the notifications, the
      // wallet debit and the busy / invoice steps (a direct update skipped all of them). the
      // stored state then decides: the PAID path can end in HOLD
      if (settled) {
        await updateOrderStatus(order.payment.pid, settled);
        state =
          (
            await prisma.payment.findUnique({
              where: { id: order.payment.id },
              select: { payment: true },
            })
          )?.payment ?? state;
      }
      // anything else (authorized, refunded, verified, initiated) — leave
      // state as NEW, the client keeps polling until it resolves further
    }

    return {
      oid: order.oid,
      cid: order.consultantId,
      status:
        state === PaymentState.PAID
          ? "success"
          : state === PaymentState.REFUSED
            ? "failed"
            : "pending",
      amountSar: order.payment.total,
      consultantName: order.consultant.name,
      consultantImage: order.consultant.image,
      date: order.meeting[0]?.date,
      time: order.meeting[0]?.time,
      failureReason,
    };
  },
);