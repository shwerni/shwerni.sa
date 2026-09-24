// utils
import { getWalletTransactions } from "@/data/wallet";
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

const PAGE_SIZE = 20;

// paginated wallet history, newest first
export const GET = createGetRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");

  return getWalletTransactions(id, page, PAGE_SIZE);
});
