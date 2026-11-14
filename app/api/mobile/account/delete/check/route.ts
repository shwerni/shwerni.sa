// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// handlers
import { checkAccountDeletion } from "@/handlers/clients/account-deletion";

// prisma data
import type { DeletionBlocker } from "@/data/account-deletion";

// what stops the signed-in client's account deletion now (empty = can delete); consultants 403
export const GET = createGetRoute<{ blockers: DeletionBlocker[] }>(async (request) => {
  const user = await requireMobileUser(request);
  return checkAccountDeletion(user.id);
});
