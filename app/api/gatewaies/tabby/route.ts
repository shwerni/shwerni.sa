// React & Next
import { NextResponse } from "next/server";

// handlers
import { tabbyPayment } from "@/handlers/gatewaies/tabby";

// prisma data
import {
  getReservationPaymentByPid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// lib
import { tabbyPaymentDetails } from "@/lib/api/gatewaies/tabby";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// utils
import { acceptedChargeAmounts, withTax } from "@/utils/tax";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// tabby webhook: the body is only a notification, every decision uses tabby's own record
export async function POST(request: Request) {
  try {
    // data
    const body = await request.json();
    const pid = typeof body?.id === "string" ? body.id : null;
    if (!pid) return NextResponse.json({ success: false });

    // the order this payment belongs to
    const order = await getReservationPaymentByPid(pid);
    const payment = order?.payment;
    if (!payment) return NextResponse.json({ success: false });

    // idempotent: tabby resends webhooks, a paid order is never changed or captured again
    if (payment.payment === PaymentState.PAID)
      return NextResponse.json({ success: true });

    // re-fetch the payment server-to-server; the body's status and amount are ignored
    const details = await tabbyPaymentDetails(pid);

    // unverifiable: change nothing, tell an admin
    if (!details) {
      await telegramAdmin(
        `shwerni-error: tabby webhook could not verify payment=${pid}`,
      );
      return NextResponse.json({ success: false });
    }

    // tabby's api uses upper case, the webhook lower case
    const status = details.status.toLowerCase();

    // if webhook return data closed (unchanged: nothing to do)
    if (status === "closed") {
      return NextResponse.json({ success: true });
    }

    // authorized: capture only when tabby's amount matches what this order charged
    if (status === "authorized") {
      // the same calculation Pay charges with
      const expected = withTax(payment.total);
      // remove after 2026-10-09: pre-cutoff orders also accept the old formulas
      const accepted = acceptedChargeAmounts(payment.total, order?.created_at);
      const amountMatches =
        accepted.includes(Number(details.amount)) && details.currency === "SAR";

      if (!amountMatches) {
        await updateOrderStatus(pid, PaymentState.HOLD);
        await telegramAdmin(
          `shwerni-error: tabby payment=${pid} amount ${details.amount} ${details.currency} does not match order total ${expected} SAR, order set to hold`,
        );
        return NextResponse.json({ success: false });
      }

      // update order to paid (after a successful capture)
      const paid = await tabbyPayment(pid, details.amount);
      return NextResponse.json({ success: paid });
    }

    // any other verified status: unsuccessful order
    await updateOrderStatus(pid, PaymentState.HOLD);
    return NextResponse.json({ success: false });
  } catch {
    // return
    return NextResponse.json({ success: false });
  }
}
