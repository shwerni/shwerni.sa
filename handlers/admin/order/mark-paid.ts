import "server-only";

// prisma data
import {
  getMarkPaidPayment,
  logMarkPaid,
  setMarkPaidMethod,
} from "@/data/order/mark-paid";
import { DASHBOARD_PAYABLE_STATES, orderStatusPaid } from "@/data/order/reserveation";

// lib
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// prisma types
import { PaymentMethod, PaymentState, UserRole } from "@/lib/generated/prisma/enums";

export type MarkPaidInput = {
  oid: number;
  method: Extract<PaymentMethod, "transaction" | "visaMoyasar" | "tabby">;
  reference?: string;
  notifications: boolean;
  daftra: boolean;
  actor: { id: string; name: string; role: UserRole };
};

export type MarkPaidResult = {
  state: boolean;
  status: "paid" | "already_paid" | "not_allowed" | "not_found" | "failed";
  message: string;
  oid: number;
};

const isUniqueConflict = (err: unknown) =>
  (err as { code?: string } | null)?.code === "P2002";

// the dashboard marks an order as paid (a bank transfer, or a gateway payment the webhook
// missed). the amount is never an input: Payment.total stays the price. it sets the method (and
// the reference as pid when pid is empty), then runs the webhooks' own PAID path
// (orderStatusPaid, its compare-and-set included) with the dashboard's flags. generic messages,
// the details in the logs
export async function markOrderPaidByDashboard(
  input: MarkPaidInput,
): Promise<MarkPaidResult> {
  const { oid } = input;
  const result = (
    status: MarkPaidResult["status"],
    message: string,
  ): MarkPaidResult => ({
    state: status === "paid" || status === "already_paid",
    status,
    message,
    oid,
  });

  try {
    const payment = await getMarkPaidPayment(oid);
    if (!payment) return result("not_found", "الطلب غير موجود");

    if (payment.payment === PaymentState.PAID)
      return result("already_paid", "الطلب مدفوع مسبقًا");
    if (!DASHBOARD_PAYABLE_STATES.includes(payment.payment))
      return result(
        "not_allowed",
        `لا يمكن تأكيد الدفع لطلب حالته ${payment.payment}`,
      );

    // the reference becomes the pid only when the payment has none
    const reference = input.reference?.trim() || undefined;
    const pid = reference && !payment.pid ? reference : undefined;

    let set: boolean;
    try {
      set = await setMarkPaidMethod({
        paymentId: payment.id,
        states: DASHBOARD_PAYABLE_STATES,
        method: input.method,
        pid,
      });
    } catch (err) {
      if (!isUniqueConflict(err)) throw err;
      console.error(`[mark-paid] oid=${oid} reference already used by another payment`);
      return result("failed", "المرجع مستخدم في طلب آخر");
    }
    if (!set) {
      // the state moved since the read
      const now = await getMarkPaidPayment(oid);
      return now?.payment === PaymentState.PAID
        ? result("already_paid", "الطلب مدفوع مسبقًا")
        : result(
            "not_allowed",
            `لا يمكن تأكيد الدفع لطلب حالته ${now?.payment ?? payment.payment}`,
          );
    }

    // the same PAID path as the webhooks
    const paid = await orderStatusPaid(
      { oid },
      {
        source: "dashboard",
        notifications: input.notifications,
        daftra: input.daftra,
      },
    );

    if (paid === "already_paid") return result("already_paid", "الطلب مدفوع مسبقًا");
    if (paid === "not_found") return result("not_found", "الطلب غير موجود");
    if (paid === "not_allowed") {
      const now = await getMarkPaidPayment(oid);
      return result(
        "not_allowed",
        `لا يمكن تأكيد الدفع لطلب حالته ${now?.payment ?? payment.payment}`,
      );
    }
    if (paid === "failed") {
      console.error(`[mark-paid] oid=${oid} the PAID path failed`);
      await telegramAdmin(`mark-paid: order #${oid} failed, check the order`);
      return result("failed", "تعذر تأكيد الدفع");
    }

    // paid, or hold (the wallet part failed after the claim, before any side effect): the method
    // and the state changed either way, so the audit is written for both
    const line = [
      "تم التأكيد يدويًا من لوحة التحكم",
      `${input.actor.name} (${input.actor.role})`,
      input.method,
      reference ?? "-",
    ].join(" — ");
    await logMarkPaid({
      oid,
      line,
      from: { payment: payment.payment, method: payment.method, pid: payment.pid },
      to: {
        payment: paid === "hold" ? PaymentState.HOLD : PaymentState.PAID,
        method: input.method,
        pid: pid ?? payment.pid,
      },
      actor: input.actor,
      note:
        paid === "hold"
          ? `${line} — wallet withdraw failed, order on hold`
          : undefined,
    }).catch((err) => {
      console.error(
        `[mark-paid] oid=${oid} audit failed`,
        err instanceof Error ? err.name : "error",
      );
    });

    if (paid === "hold") {
      console.error(`[mark-paid] oid=${oid} wallet withdraw failed, order on hold`);
      return result("failed", "تعذر خصم جزء المحفظة، الطلب معلّق");
    }
    return result("paid", "تم تأكيد الدفع");
  } catch (err) {
    console.error(
      `[mark-paid] oid=${oid} error`,
      err instanceof Error ? err.name : "error",
    );
    return result("failed", "تعذر تأكيد الدفع");
  }
}
