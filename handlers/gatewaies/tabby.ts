"use server";
// lib
import { capturePayment } from "@/lib/api/gatewaies/tabby";

// prisma data
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// payment state update
export async function tabbyPayment(pid: string, amount: string) {
  // capture payment
  await capturePayment(pid, amount);
  // update order state
  try {
    // change state to paid
    await updateOrderStatus(pid, PaymentState.PAID);
  } catch {
    // if unsuccessful order
    await updateOrderStatus(pid, PaymentState.HOLD);
  }
}
