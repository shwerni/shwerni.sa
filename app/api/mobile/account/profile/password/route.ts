// packages
import bcrypt from "bcryptjs";
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileSession } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";
import { cooldownDays, cooldownMessage } from "@/utils/user";

// prisma data
import { savePasswordChange } from "@/data/password-change";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
});

// update password, allowed once every 10 days, requires the current password
export const POST = createPostRoute(async (request) => {
  const { user: sessionUser, session } = await requireMobileSession(request);
  const id = sessionUser.id;
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

  // the new password and its stamp; the other app sessions end (this one is kept) and website
  // logins from before are refused
  await savePasswordChange(id, await bcrypt.hash(newPassword, 10), session.id);

  return { ok: true };
});
