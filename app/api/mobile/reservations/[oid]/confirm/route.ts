// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";
import { acceptedGatewayAmounts } from "@/utils/tax";

// prisma types
import { PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";
import { verifyMoyasarPayment } from "@/utils/gatewaies/verify/verify";
import { updateOrderStatus } from "@/data/order/reserveation";
import { tabbyPaymentDetails } from "@/lib/api/gatewaies/tabby";
import { settleAuthorizedTabby } from "@/handlers/gatewaies/tabby";

interface PaymentResultResponse {
  oid: number;
  cid: number;
  status: "success" | "pending" | "failed";
  method: string | null;
  amountSar: number;
  consultantName: string;
  consultantImage: string | null;
  date: string | undefined;
  time: string | undefined;
  failureReason: string | null;
}

// maps internal payment state to the three-way status the result screen understands
function toResultStatus(state: PaymentState): "success" | "pending" | "failed" {
  if (state === PaymentState.PAID) return "success";
  if (state === PaymentState.NEW) return "pending";
  return "failed";
}

/**
 * verify a payment server-to-server and return a safe order dto - dispatches
 * to the gateway-specific verifier based on which method the order used,
 * shared by the single result screen regardless of gateway
 */
export const POST = createPostRoute<PaymentResultResponse, { oid: string }>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { oid } = await context.params;
    const { pid } = await request.json();

    console.log(`[payment-result] checking oid=${oid} for user=${user.id}`);

    const order = await prisma.order.findFirst({
      where: { oid: Number(oid), author: user.id },
      include: {
        payment: true,
        meeting: { select: { time: true, date: true } },
        consultant: { select: { name: true, image: true } },
      },
    });

    if (!order?.payment) {
      console.error(`[payment-result] order not found oid=${oid}`);
      throw new Error("order_not_found");
    }

    console.log(
      `[payment-result] oid=${oid} pid=${pid} method=${order.payment.method} currentState=${order.payment.payment}`,
    );

    // first confirm for this order — the sdk-charged pid is only known now,
    // save it so a retry/duplicate confirm can be matched against it below
    if (!order.payment.pid) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { pid },
      });
    } else if (order.payment.pid !== pid) {
      throw new Error("payment_mismatch");
    }

    let state = order.payment.payment;
    let failureReason: string | null = null;

    // the stored state decides what the app is told: the PAID path can end in HOLD (a taken
    // instant slot, a failed wallet debit, a wrong amount), which must not show as success
    const storedState = async () =>
      (
        await prisma.payment.findUnique({
          where: { id: order.payment!.id },
          select: { payment: true },
        })
      )?.payment ?? state;

    if (state === PaymentState.NEW && pid && order.payment.method === PaymentMethod.tabby) {
      console.log(`[payment-result] re-verifying with tabby, pid=${pid}`);

      // the tabby webhook's own path: an AUTHORIZED payment gets the wallet guard, the amount
      // check and the capture (once, even when the webhook runs too), then PAID; a wrong amount or
      // a wallet part goes to HOLD with an alert. rejected / expired → REFUSED. CLOSED (captured,
      // or closed by a cancel or refund) and the rest change nothing here: the webhook settles it
      const details = await tabbyPaymentDetails(pid);
      const status = details?.status.toUpperCase();
      console.log(`[payment-result] tabby returned status=${status ?? "unverifiable"}`);

      if (details && status === "AUTHORIZED") {
        await settleAuthorizedTabby(pid, details);
      } else if (status === "REJECTED" || status === "EXPIRED") {
        await updateOrderStatus(pid, PaymentState.REFUSED);
      }

      state = await storedState();
    } else if (state === PaymentState.NEW && pid) {
      console.log(`[payment-result] re-verifying with gateway, pid=${pid}`);

      const result = await verifyMoyasarPayment(
        pid,
        // the card's part (the wallet part is debited at PAID); remove after 2026-10-09:
        // pre-cutoff orders also accept the old formulas
        acceptedGatewayAmounts(order.payment, order.created_at),
        order.oid,
      );

      console.log(`[payment-result] gateway returned:`, result);

      state = result.state;
      failureReason = result.failureReason;

      if (state !== PaymentState.NEW) {
        await updateOrderStatus(pid, state);
        state = await storedState();

        console.log(
          `[payment-result] updated payment ${order.payment.id} to state=${state}`,
        );
      }
    }

    return {
      oid: order.oid,
      cid: order.consultantId,
      status: toResultStatus(state),
      method: order.payment.method,
      amountSar: order.payment.total,
      consultantName: order.consultant.name,
      consultantImage: order.consultant.image,
      date: order.meeting[0]?.date,
      time: order.meeting[0]?.time,
      failureReason,
    };
  },
);
