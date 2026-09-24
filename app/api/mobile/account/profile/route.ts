// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";
import { cooldownDays } from "@/utils/user";

// basic account info with the phone change lock state
export const GET = createGetRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const user = await prisma.user.findUnique({
    where: { id },
    select: { name: true, phone: true, phoneChangedAt: true },
  });

  if (!user) throw new HttpError("المستخدم غير موجود", 404);

  return {
    name: user.name,
    phone: user.phone,
    phoneLockDays: cooldownDays(user.phoneChangedAt),
    passwordLockDays: cooldownDays(user.passwordChangedAt),
  };
});
