// packages
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// handlers
import { deleteAccount } from "@/handlers/clients/account-deletion";

const DeleteSchema = z.object({ code: z.string().regex(/^\d{5}$/) });

// delete (anonymize) the signed-in client's account with the code sent to its phone; 400 for a
// wrong or expired code, 409 with the blockers, consultants 403
export const POST = createPostRoute<{ deleted: true }>(async (request) => {
  const user = await requireMobileUser(request);

  const parsed = DeleteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) throw new HttpError("رمز التحقق غير صحيح أو منتهي الصلاحية", 400);

  return deleteAccount(user.id, parsed.data.code);
});
