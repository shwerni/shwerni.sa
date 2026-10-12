"use server";

// handlers
import { PayReconciliation } from "@/handlers/admin/order/payment";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { createAction, fail } from "@/lib/safe-action";

// utils
import { reconciliationCheckoutSchema } from "@/utils/reconciliation";

// PayReconciliation's failure steps → this action's error codes (anything else is a payment failure)
const checkoutErrors = {
  invalid: "invalid_input",
  unavailable: "unavailable",
  blocked: "blocked",
  conflict: "slot_taken",
  slot_unavailable: "slot_taken",
} as const;

const checkoutError = (step?: string) =>
  checkoutErrors[step as keyof typeof checkoutErrors] ?? "payment_failed";

// public: the reconciliation booking (guests too). only the client's choices are accepted; the
// consultant, price and share come from the finance settings, and the order's author from the
// session. on success PayReconciliation redirects to the gateway, so this only ever returns a failure
export const checkoutReconciliation = createAction(
  {
    name: "reconciliation.checkout",
    schema: reconciliationCheckoutSchema,
    auth: "public",
    rateLimit: [
      { by: "ip", limit: 10, window: "10 m" },
      { by: (input) => input.phone, limit: 5, window: "1 h" },
    ],
  },
  async (input, { user }) => {
    if (!(await checkHuman("checkoutReconciliation")))
      return fail("bot_detected");

    const result = await PayReconciliation(input, user?.id ?? null);
    return fail(checkoutError(result?.step));
  },
);
