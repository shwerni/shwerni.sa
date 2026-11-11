// React & Next
import { NextResponse } from "next/server";

// handlers
import { settleAuthorizedTabby } from "@/handlers/gatewaies/tabby";

// prisma data
import {
  getReservationPaymentByPid,
  updateOrderStatus,
} from "@/data/order/reserveation";

// lib
import { tabbyPaymentDetails } from "@/lib/api/gatewaies/tabby";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

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

    // authorized: the wallet guard, the amount check and the capture, once, then PAID (shared
    // with the app's confirm, handlers/gatewaies/tabby.ts)
    if (status === "authorized") {
      const paid = await settleAuthorizedTabby(pid, details);
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
