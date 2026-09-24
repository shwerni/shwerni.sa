// utils
import { HttpError } from "@/lib/api/http-error";
import { toggleFavorite } from "@/data/favorites";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { createDeleteRoute, createPatchRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

interface Params {
  cid: string;
}

// remove a consultant from the signed in user's favorites
export const DELETE = createDeleteRoute<{ ok: true }, Params>(async (request, { params }) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const { cid: cidParam } = await params;
  const cid = Number(cidParam);
  if (!cid || Number.isNaN(cid)) throw new HttpError("معرّف غير صالح", 400);

  await prisma.favorite.deleteMany({ where: { userId: id, consultantId: cid } });
  return { ok: true };
});

// flip favorite state for this consultant, returns the resulting state
export const PATCH = createPatchRoute<{ isFavorite: boolean }, Params>(async (request, { params }) => {
  const { id } = await requireMobileUser(request);
  if (!id) throw new HttpError("غير مصرح", 401);

  const { cid: cidParam } = await params;
  const cid = Number(cidParam);
  if (!cid || Number.isNaN(cid)) throw new HttpError("معرّف غير صالح", 400);

  const isFavorite = await toggleFavorite(id, cid);
  return { isFavorite };
});