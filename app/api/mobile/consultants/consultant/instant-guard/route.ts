// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { getOwnerbyAuthor } from "@/data/consultant";
import { HttpError } from "@/lib/api/http-error";
import { checkUpcomingPaidSession } from "@/data/order/reserveation";

interface InstantGuardResponse {
  blocked: boolean;
}

export const GET = createGetRoute<InstantGuardResponse>(async (request) => {
  const user = await requireMobileUser(request);

  const owner = await getOwnerbyAuthor(user.id);
  if (!owner) throw new HttpError("consultant profile not found", 404);

  const blocked = await checkUpcomingPaidSession(owner.cid);
  return { blocked };
});
