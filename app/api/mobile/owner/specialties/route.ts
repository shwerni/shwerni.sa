// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import {
  getOwnerSpecialties,
  type OwnerSpecialties,
} from "@/data/mobile/owner-specialties";

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
