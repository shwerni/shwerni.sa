// utils
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// handlers
import { requestAccountDeletionCode } from "@/handlers/clients/account-deletion";

// a deletion code to the account's own phone (never a phone from the request); 409 with the
// blockers, 429 after 3 codes in 10 minutes, consultants 403
export const POST = createPostRoute<{ sentTo: string; expiresIn: number }>(async (request) => {
  const user = await requireMobileUser(request);
  return requestAccountDeletionCode(user.id);
});
