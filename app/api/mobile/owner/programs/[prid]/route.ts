// packages
import { z } from "zod";
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createGetRoute, createPatchRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { toggleProgramState } from "@/data/programs";
import {
  getOwnerEnrollment,
  getOwnerProgram,
  type OwnerEnrollment,
  type OwnerProgramDetails,
} from "@/data/mobile/owner-programs";

interface Params {
  prid: string;
}

interface OwnerProgramResponse {
  program: OwnerProgramDetails;
}

interface OwnerProgramSwitched {
  enrollment: NonNullable<OwnerEnrollment>;
}

const SwitchSchema = z.object({ active: z.boolean() });

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

// the approved owner turns receiving bookings for a program they joined on or off, with the
// website's toggleProgramState (allowed any time, like the website; booked program orders go on).
// not enrolled is a 404
export const PATCH = createPatchRoute<OwnerProgramSwitched, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const prid = parseIntId((await context.params).prid);
    if (prid === null) throw new HttpError("not found", 404);

    const body = await request.json().catch(() => null);
    const parsed = SwitchSchema.safeParse(body);
    if (!parsed.success) throw new HttpError("بيانات خاطئة", 400);

    if (!(await getOwnerEnrollment(consultant.cid, prid))) {
      throw new HttpError("not found", 404);
    }

    const enroll = await toggleProgramState(prid, consultant.cid, parsed.data.active);
    if (!enroll) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return { enrollment: { status: enroll.status, active: enroll.active } };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
