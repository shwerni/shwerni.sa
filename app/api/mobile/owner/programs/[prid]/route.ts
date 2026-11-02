// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import {
  getOwnerProgram,
  type OwnerProgramDetails,
} from "@/data/mobile/owner-programs";

interface Params {
  prid: string;
}

interface OwnerProgramResponse {
  program: OwnerProgramDetails;
}

// one published program with its description and features, and the approved owner's enrollment.
// a missing or unpublished program is a 404
export const GET = createGetRoute<OwnerProgramResponse, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const prid = parseIntId((await context.params).prid);
    if (prid === null) throw new HttpError("not found", 404);

    const program = await getOwnerProgram(consultant.cid, prid);
    if (!program) throw new HttpError("not found", 404);

    return { program };
  },
  { errorMessage: "failed to fetch" },
);
