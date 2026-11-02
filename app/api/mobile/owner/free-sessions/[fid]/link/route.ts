// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { parseIntId } from "@/lib/api/routes/parse-id";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { freeSessionMeetingUrl } from "@/data/freesession";
import { ownsFreeSession } from "@/data/mobile/owner-free-sessions";

interface Params {
  fid: string;
}

interface OwnerFreeSessionLink {
  url: string;
}

// the meeting link of one of the approved owner's free sessions (another one is a 404). the
// website's freeSessionMeetingUrl: the stored link, or a new one saved the first time
export const GET = createGetRoute<OwnerFreeSessionLink, Params>(
  async (request: NextRequest, context) => {
    const { consultant } = await requireApprovedOwner(request);
    const fid = parseIntId((await context.params).fid);
    if (fid === null || !(await ownsFreeSession(consultant.cid, fid))) {
      throw new HttpError("not found", 404);
    }

    const url = await freeSessionMeetingUrl(fid);
    if (!url) throw new HttpError("حدث خطأ ما برجاء المحاولة مرة اخري", 500);

    return { url };
  },
  { errorMessage: "حدث خطأ ما برجاء المحاولة مرة اخري" },
);
