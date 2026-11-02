// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerPrograms, type OwnerProgram } from "@/data/mobile/owner-programs";

interface OwnerPrograms {
  programs: OwnerProgram[];
}

// the published programs (public card fields, never commission) and the approved owner's
// enrollment in each
export const GET = createGetRoute<OwnerPrograms>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { programs: await getOwnerPrograms(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);
