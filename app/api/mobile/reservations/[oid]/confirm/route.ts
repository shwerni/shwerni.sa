// packages
import { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

// prisma types
import { PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";
import { verifyMoyasarPayment } from "@/utils/gatewaies/verify/verify";
import { verifyTabbyPayment } from "@/utils/gatewaies/verify/tabby";
import { updateOrderStatus } from "@/data/order/reserveation";

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

    if (state === PaymentState.NEW && pid) {
      console.log(`[payment-result] re-verifying with gateway, pid=${pid}`);

      const result =
        order.payment.method === PaymentMethod.tabby
          ? await verifyTabbyPayment(pid)
          : await verifyMoyasarPayment(pid, order.payment.total, order.oid);

      console.log(`[payment-result] gateway returned:`, result);

      state = result.state;
      failureReason = result.failureReason;

      if (state !== PaymentState.NEW) {
        await updateOrderStatus(pid, state);

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
