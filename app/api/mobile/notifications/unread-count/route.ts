// utils
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// lib
import prisma from "@/lib/database/db";

export const GET = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);

  const count = await prisma.notification.count({
    where: { userId: user.id, read: false, sent: true },
  });

  return { count };
});
