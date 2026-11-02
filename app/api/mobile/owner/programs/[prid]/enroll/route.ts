// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { EnrollOnProgram } from "@/data/programs";
import {
  getOwnerEnrollment,
  isProgramPublished,
  type OwnerEnrollment,
} from "@/data/mobile/owner-programs";

interface Params {
  prid: string;
}

interface OwnerEnrolled {
  enrollment: NonNullable<OwnerEnrollment>;
}

// the approved owner asks to join a published program with the website's EnrollOnProgram: the
// enrollment starts PENDING and inactive, for the admin to review. the body is ignored. a missing
// or unpublished program is a 404, an existing enrollment a 409
export const POST = createPostRoute<OwnerEnrolled, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const prid = parseIntId((await context.params).prid);
    if (prid === null || !(await isProgramPublished(prid))) {
      throw new HttpError("not found", 404);
    }

    const already = () => new HttpError("أنت منضم لهذا البرنامج بالفعل", 409);
    if (await getOwnerEnrollment(consultant.cid, prid)) throw already();

    const enroll = await EnrollOnProgram(prid, consultant.cid);
    // null: enrolled in the meantime (the unique key), or the insert failed
    if (!enroll) {
      if (await getOwnerEnrollment(consultant.cid, prid)) throw already();
      throw new Error("enrollment not created");
    }

    return { enrollment: { status: enroll.status, active: enroll.active } };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
