// packages
import bcrypt from "bcryptjs";
import { z } from "zod";

// utils
import { prisma } from "@/lib/prisma";
import { HttpError } from "@/lib/api/http-error";
import { requireMobileUser } from "@/lib/auth/mobile";
import { createPostRoute } from "@/lib/api/route-factory";
import { cooldownDays, cooldownMessage } from "@/lib/account/cooldown";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

// update password, allowed once every 10 days, requires the current password
export const POST = createPostRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError(parsed.error.issues[0].message, 400);
  const { currentPassword, newPassword } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { password: true, passwordChangedAt: true },
  });
  if (!user) throw new HttpError("المستخدم غير موجود", 404);

  const days = cooldownDays(user.passwordChangedAt);
  if (days > 0) throw new HttpError(cooldownMessage("كلمة المرور", days), 429);

  // legacy/mobile accounts might not have a password set yet
  const matches =
    user.password && (await bcrypt.compare(currentPassword, user.password));
  if (!matches) throw new HttpError("كلمة المرور الحالية غير صحيحة", 401);

  await prisma.user.update({
    where: { id },
    data: {
      password: await bcrypt.hash(newPassword, 10),
      passwordChangedAt: new Date(),
    },
  });

  return { ok: true };
});
