"use server";

// hotfix wrappers for booking: same signatures and return shapes as the server-only originals.
// public by design; the booking's user comes from the session, guests keep each form's placeholder.
// pricing stays inside Pay (server side), moving it to services/pricing.ts is phase 3.

// prisma data
import { Pay as PayHandler } from "@/handlers/admin/order/payment";
import { confirmFreeSession as confirmFreeSessionHandler } from "@/handlers/admin/freesession";
import { confirmReconciliation as confirmReconciliationHandler } from "@/handlers/clients/order";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { sessionUser } from "@/lib/auth/guards";

// public: web booking and payment redirect
export async function Pay(...[data]: Parameters<typeof PayHandler>) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("Pay"))) return { state: false, message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً" };
  const user = await sessionUser();
  // guests: the forms send "temp" (discover sends "")
  const guest = data.user === "" ? "" : "temp";
  return PayHandler({ ...data, user: user?.id ?? guest });
}

// public: free session booking
export async function confirmFreeSession(
  ...[data]: Parameters<typeof confirmFreeSessionHandler>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("confirmFreeSession"))) return;
  const user = await sessionUser();
  return confirmFreeSessionHandler({ ...data, user: user?.id ?? "temp" });
}

// public: reconciliation request; the author argument is ignored
export async function confirmReconciliation(
  ...[, ...rest]: Parameters<typeof confirmReconciliationHandler>
) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("confirmReconciliation"))) return { state: false, message: "حدث حطأ ما برجاء المحاولة مرة اخري" };
  const user = await sessionUser();
  return confirmReconciliationHandler(user?.id ?? undefined, ...rest);
}
