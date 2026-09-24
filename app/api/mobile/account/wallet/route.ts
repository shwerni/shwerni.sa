// utils
import { getWalletByAuthor } from "@/data/wallet";
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// wallet balance for the signed in user
export const GET = createGetRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const wallet = await getWalletByAuthor(id);

  return { credit: wallet?.credit ?? 0 };
});
