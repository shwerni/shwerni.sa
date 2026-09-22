// packages
import { z } from "zod";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import prisma from "@/lib/database/db";

const schema = z.object({ name: z.string().trim().min(2).max(50) });

// update display name (no limit)
export const POST = createPostRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  // never write without a session user id, prisma drops undefined filters
  if (!id) throw new HttpError("غير مصرح", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError("الاسم غير صالح", 400);

  await prisma.user.update({ where: { id }, data: { name: parsed.data.name } });

  return { ok: true };
});
