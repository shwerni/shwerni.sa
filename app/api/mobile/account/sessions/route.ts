// utils
import { getMeetings } from "@/data/meetings";
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
export type SessionFilter = "upcoming" | "completed" | "cancelled" | "packages";

export const GET = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);

  const searchParams = request.nextUrl.searchParams;
  const status = (searchParams.get("status") ?? "upcoming") as SessionFilter;
  const cursor = searchParams.get("cursor") ?? undefined;
  const limit = Number(searchParams.get("limit") ?? 10);

  return getMeetings({ userId: user.id, status, cursor, limit });
});
