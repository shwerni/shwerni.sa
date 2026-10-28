// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { requireMobileOwner } from "@/lib/auth/require-approved-owner";
import { createGetRoute, createPostRoute } from "@/lib/api/routes/route-factory";

// data
import { getOwnerApprovalByUser } from "@/data/consultant";
import { getOwnerOath } from "@/data/mobile/owner-oath";
import { confirmOathAcceptance } from "@/data/admin/tools/oath";

// constants
import { CONSULTANT_OATH } from "@/constants/oath";

interface OwnerOath {
  accepted: boolean;
  acceptedAt: string | null;
  title: string;
  intro: string;
  heading: string;
  terms: string[];
}

interface OwnerOathAccepted {
  accepted: true;
  acceptedAt: string;
}

// the oath text (the website's own constant) and whether this owner accepted it. works before
// approval (requireMobileOwner); no consultant row reads as not accepted. a failed lookup is a 500
export const GET = createGetRoute<OwnerOath>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const consultant = await getOwnerApprovalByUser(user.id);
    const oath = consultant ? await getOwnerOath(consultant.cid) : null;

    return {
      accepted: !!oath,
      acceptedAt: oath?.acceptedAt.toISOString() ?? null,
      title: CONSULTANT_OATH.title,
      intro: CONSULTANT_OATH.intro,
      heading: CONSULTANT_OATH.heading,
      terms: [...CONSULTANT_OATH.terms],
    };
  },
  { errorMessage: "failed to fetch" },
);

// accept the oath for the session owner's own consultant row (the website's upsert, safe to
// repeat). the body is ignored: the cid always comes from the session
export const POST = createPostRoute<OwnerOathAccepted>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const consultant = await getOwnerApprovalByUser(user.id);
    if (!consultant) throw new HttpError("لم يتم إنشاء ملفك بعد", 404);

    // null = the upsert failed (it catches its own errors)
    if (!(await confirmOathAcceptance(user.id))) {
      throw new Error("oath acceptance failed");
    }

    const oath = await getOwnerOath(consultant.cid);
    if (!oath) throw new Error("oath acceptance not stored");

    return { accepted: true, acceptedAt: oath.acceptedAt.toISOString() };
  },
  { errorMessage: "failed to save" },
);
