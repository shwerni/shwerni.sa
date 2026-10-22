"use server";

// hotfix wrappers for booking: same signatures and return shapes as the server-only originals.
// public by design; the booking's user comes from the session, guests keep each form's placeholder.
// pricing stays inside Pay (server side), moving it to services/pricing.ts is phase 3.

// prisma data
import { Pay as PayHandler } from "@/handlers/admin/order/payment";
import { confirmFreeSession as confirmFreeSessionHandler } from "@/handlers/admin/freesession";
import { instantOrderAllowed } from "@/data/instant-limits";

// lib
import { checkHuman } from "@/lib/bot-protection";
import { sessionUser } from "@/lib/auth/guards";
import { getClientIp } from "@/lib/rate-limit";

// utils
import { baseActionErrors } from "@/utils/action-errors";

// public: web booking and payment redirect
export async function Pay(...[data]: Parameters<typeof PayHandler>) {
  // a bot gets the failure result this action already returns
  if (!(await checkHuman("Pay"))) return { state: false, message: "تعذّر إتمام العملية، برجاء المحاولة لاحقاً" };
  // instant: at most 3 created instant orders per phone and 20 per ip in 10 minutes
  // (refused attempts don't count), the same failure result shape
  if (
    data.order === "instant" &&
    !(await instantOrderAllowed(await getClientIp(), data.phone))
  )
    return { state: false, message: baseActionErrors.rate_limited };
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
