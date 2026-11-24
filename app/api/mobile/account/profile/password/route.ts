// packages
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileSession } from "@/lib/auth/require-mobile-user";
import { hashWebsitePassword } from "@/lib/auth/password";
import prisma from "@/lib/database/db";
import { cooldownDays, cooldownMessage } from "@/utils/user";

// prisma data
import { savePasswordChange } from "@/data/password-change";

// handlers
import { checkCurrentPassword } from "@/handlers/auth/current-password";
import { baseActionErrors } from "@/utils/action-errors";

const schema = z.object({
  currentPassword: z.string().min(1),
  // saved trimmed (utils/password.ts): the length counts without the spaces
  newPassword: z.string().trim().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
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
    select: { passwordChangedAt: true },
  });
  if (!user) throw new HttpError("المستخدم غير موجود", 404);

  const days = cooldownDays(user.passwordChangedAt);
  if (days > 0) throw new HttpError(cooldownMessage("كلمة المرور", days), 429);

  // the current password (the same check and try limit as the website's settings). legacy/mobile
  // accounts might not have a password set yet: refused, as before
  const current = await checkCurrentPassword(id, currentPassword);
  if (current === "rate_limited") throw new HttpError(baseActionErrors.rate_limited, 429);
  if (current !== "ok") throw new HttpError("كلمة المرور الحالية غير صحيحة", 401);

  // the new password and its stamp; the other app sessions end (this one is kept) and website
  // logins from before are refused
  await savePasswordChange(id, await hashWebsitePassword(newPassword), session.id);

  return { ok: true };
});
