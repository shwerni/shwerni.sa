// utils
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// lib
import prisma from "@/lib/database/db";

// rows returned per page
const PAGE_SIZE = 20;

export const GET = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);
  const cursor = new URL(request.url).searchParams.get("cursor");

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id, sent: true },
    orderBy: [{ sentAt: "desc" }, { id: "desc" }],
    take: PAGE_SIZE,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  return { notifications, nextCursor: notifications.at(-1)?.id ?? null };
});
