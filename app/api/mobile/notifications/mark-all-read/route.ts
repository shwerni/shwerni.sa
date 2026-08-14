// utils
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// lib
import prisma from "@/lib/database/db";

export const POST = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);

  const { count } = await prisma.notification.updateMany({
    where: { userId: user.id, read: false, sent: true },
    data: { read: true, readAt: new Date() },
  });

  return { count };
});