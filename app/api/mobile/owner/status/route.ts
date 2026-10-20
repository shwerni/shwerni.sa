// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerApprovalByUser } from "@/data/consultant";

// "NONE" = owner account without a consultant row yet
type OwnerApproval = "NONE" | "PENDING" | "FLAGGED" | "REJECTED" | "APPROVED";

interface OwnerStatus {
  approval: OwnerApproval;
  cid: number | null;
  name: string | null;
}

// the app's role gate: which owner screens this account may open. the only /owner/*
// route that works before approval, so it uses requireMobileOwner, not requireApprovedOwner
export const GET = createGetRoute<OwnerStatus>(
  async (request: NextRequest) => {
    const user = await requireMobileOwner(request);
    const consultant = await getOwnerApprovalByUser(user.id);

    if (!consultant) return { approval: "NONE", cid: null, name: null };

    return {
      approval: consultant.approved,
      cid: consultant.cid,
      name: consultant.name,
    };
  },
  { errorMessage: "failed to fetch" },
);
