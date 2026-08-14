// utils
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// lib
import prisma from "@/lib/database/db";

// reads the [id] segment from the path - the shared route wrapper only
// forwards the request object, not the dynamic route params
const idFromPath = (url: string) => new URL(url).pathname.split("/").at(-2) ?? "";

export const POST = createGetRoute(async (request) => {
  const user = await requireMobileUser(request);
  const id = idFromPath(request.url);

  if (!id) throw new HttpError("notification id is required", 400);

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!notification || notification.userId !== user.id) {
    throw new HttpError("notification not found", 404);
  }

  await prisma.notification.update({
    where: { id },
    data: { read: true, readAt: new Date() },
  });

  return { success: true };
});
