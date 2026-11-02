// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerDues, sumShare } from "@/data/mobile/owner-dues";

interface OwnerDuesSummary {
  unpaid: number;
}

// the amount on the app's dues row: for now the website dues page's total (decided 2026-10-30),
// the same number GET /owner/dues gives for "all". the real unpaid amount once payouts are tracked
export const GET = createGetRoute<OwnerDuesSummary>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { unpaid: sumShare(await getOwnerDues(consultant.cid)) };
  },
  { errorMessage: "failed to fetch" },
);
