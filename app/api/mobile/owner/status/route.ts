// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerApprovalByUser } from "@/data/consultant";
import { getOwnerOath } from "@/data/mobile/owner-oath";

// prisma types
import type { ConsultantState } from "@/lib/generated/prisma/enums";

// "NONE" = owner account without a consultant row yet
type OwnerApproval = "NONE" | "PENDING" | "FLAGGED" | "REJECTED" | "APPROVED";

interface OwnerStatus {
  approval: OwnerApproval;
  cid: number | null;
  name: string | null;
  // a consultant_oaths row exists for this owner's cid
  oath: boolean;
  // Consultant.statusA (set by review / admin), null without a row
  listing: ConsultantState | null;
  // Consultant.status (the consultant's own switch), null without a row
  visible: boolean | null;
}

// the app's role gate: which owner screens this account may open. the only /owner/*
// route that works before approval, so it uses requireMobileOwner, not requireApprovedOwner
export const GET = createGetRoute<OwnerStatus>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const consultant = await getOwnerApprovalByUser(user.id);

    if (!consultant) {
      return {
        approval: "NONE",
        cid: null,
        name: null,
        oath: false,
        listing: null,
        visible: null,
      };
    }

    // a failed lookup throws (500), so the app retries instead of showing the oath page
    const oath = await getOwnerOath(consultant.cid);

    return {
      approval: consultant.approved,
      cid: consultant.cid,
      name: consultant.name,
      oath: !!oath,
      listing: consultant.statusA,
      visible: consultant.status,
    };
  },
  { errorMessage: "failed to fetch" },
);
