// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute, createPutRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { updateConsultantSpecialties } from "@/data/specialties";
import {
  getOwnerSpecialties,
  type OwnerSpecialties,
} from "@/data/mobile/owner-specialties";

interface OwnerSpecialtiesSaved {
  selected: string[];
}

// specialty ids, no repeats ([] clears the selection)
const SpecialtiesSchema = z.object({
  ids: z
    .array(z.string().min(1).max(64))
    .refine((ids) => new Set(ids).size === ids.length),
});

// the approved owner's category, its sub-specialties and the ones they picked
export const GET = createGetRoute<OwnerSpecialties>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const specialties = await getOwnerSpecialties(consultant.cid);
    if (!specialties) throw new HttpError("forbidden", 403);

    return specialties;
  },
  { errorMessage: "failed to fetch" },
);

// replace the approved owner's picked specialties with the website's save (one transaction); every
// id must be a specialty of the consultant's own category
export const PUT = createPutRoute<OwnerSpecialtiesSaved>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const body = await request.json().catch(() => null);
    const parsed = SpecialtiesSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);
    const ids = parsed.data.ids;

    const current = await getOwnerSpecialties(consultant.cid);
    if (!current) throw new HttpError("forbidden", 403);

    const allowed = new Set(current.specialties.map((specialty) => specialty.id));
    if (!ids.every((id) => allowed.has(id))) throw new HttpError("بيانات خاطئة", 400);

    await updateConsultantSpecialties(consultant.cid, ids);

    return { selected: ids };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
