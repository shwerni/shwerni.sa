// React & Next
import { NextResponse } from "next/server";

// handlers
import { tabbyPayment } from "@/handlers/gatewaies/tabby";

// prisma data
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

export async function POST(request: Request) {
  try {
    // data
    const payment = await request.json();
    // if webhook return data closed
    if (payment.status === "closed") {
      return NextResponse.json({ success: true });
    }
    // if webhook return data authorized
    if (payment.status === "authorized") {
      // update order to paid
      await tabbyPayment(payment.id, payment.amount);
      // return
      return NextResponse.json({ success: true });
    }
    // if unsuccessful order
    await updateOrderStatus(payment.id, PaymentState.HOLD);
    // return
    return NextResponse.json({ success: false });
  } catch (error) {
    // return
    return NextResponse.json({ success: false });
  }
}
