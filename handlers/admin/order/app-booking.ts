import "server-only";

// utils
import { HttpError } from "@/lib/api/http-error";

// prisma data
import { getWalletByAuthor } from "@/data/wallet";
import { setAppWalletPart } from "@/data/mobile/booking";
import { updateOrderStatus } from "@/data/order/reserveation";

// prisma types
import { PaymentMethod, PaymentState } from "@/lib/generated/prisma/enums";

export type AppBookingMethod = "visaMoyasar" | "tabby";

// the create routes' answer (the app's BookingCreated)
export interface BookingCreated {
  oid: number;
  next: "moyasar" | "tabby" | "paid";
  amount: number; // halalas the gateway charges; 0 when the wallet paid it all
  total: number; // sar with tax
}

// how the charge is split: the wallet part (sar) and what the gateway charges (sar)
export interface AppPaymentPlan {
  wallet: number;
  due: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * the wallet and the method, decided before the order exists (the quote's own rule): the wallet
 * covers up to the total (the balance now; debited at PAID); with a wallet part and something
 * still due, the rest is card only; the method must be one the finance config allows
 * @param total the quote's tax-inclusive total (sar)
 * @param allowed the finance config's payment methods
 * @throws HttpError 400 for tabby with the wallet, or a method the config doesn't allow
 */
export async function planAppPayment(
  userId: string,
  total: number,
  useWallet: boolean | undefined,
  method: AppBookingMethod,
  allowed: PaymentMethod[],
): Promise<AppPaymentPlan> {
  let wallet = 0;
  if (useWallet) {
    const balance = round2((await getWalletByAuthor(userId))?.credit ?? 0);
    wallet = round2(Math.min(Math.max(balance, 0), total));
  }
  const due = round2(total - wallet);

  if (due > 0) {
    if (!allowed.includes(method)) throw new HttpError("طريقة الدفع غير مدعومة", 400);
    if (wallet > 0 && method !== PaymentMethod.visaMoyasar) {
      throw new HttpError("الدفع مع المحفظة متاح بالبطاقة فقط", 400);
    }
  }
  return { wallet, due };
}

/**
 * after the order exists: store the wallet part, then the next step for the app. the wallet
 * covering all → the order goes PAID at once through updateOrderStatus (the wallet debit, the
 * meeting, the notifications); a wallet part → the card charges the rest (confirm checks it
 * against the total minus the wallet part); no wallet → the chosen gateway, the whole total
 * @throws HttpError 409 when the wallet can't pay it all at PAID (the order is then HOLD with an admin alert)
 */
export async function finishAppBooking(
  order: { oid: number; payment: { id: string } },
  plan: AppPaymentPlan,
  method: AppBookingMethod,
  total: number,
): Promise<BookingCreated> {
  if (plan.wallet > 0) {
    const pid = await setAppWalletPart(order.payment.id, order.oid, plan.wallet, plan.due === 0);

    if (pid) {
      const paid = await updateOrderStatus(pid, PaymentState.PAID);
      if (paid !== "paid") {
        console.error(`[app-booking] oid=${order.oid} full wallet payment ended as ${String(paid)}`);
        throw new HttpError("تعذّر الدفع من المحفظة، برجاء المحاولة مرة أخرى", 409);
      }
      return { oid: order.oid, next: "paid", amount: 0, total };
    }
  }

  return {
    oid: order.oid,
    next: method === PaymentMethod.tabby ? "tabby" : "moyasar",
    amount: Math.round(plan.due * 100),
    total,
  };
}
