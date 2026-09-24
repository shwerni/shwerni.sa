// packages
import { z } from "zod";

// utils

import { getFavoriteConsultants } from "@/data/favorites";
import {
  createGetRoute,
  createPostRoute,
} from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import prisma from "@/lib/database/db";

const schema = z.object({ cid: z.number().int().positive() });

// list the signed in user's favorite consultants
export const GET = createGetRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  return getFavoriteConsultants(id);
});

// add a consultant to the signed in user's favorites
export const POST = createPostRoute(async (request) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const parsed = schema.safeParse(await request.json());
  if (!parsed.success) throw new HttpError("بيانات غير صالحة", 400);

  try {
    await prisma.favorite.create({
      data: { userId: id, consultantId: parsed.data.cid },
    });
  } catch (e) {
    if ((e as { code?: string }).code !== "P2002") throw e;
  }

  return { ok: true };
});
