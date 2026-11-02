// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerTimings, type OwnerTimingDays } from "@/data/mobile/owner-timings";

interface OwnerTimings {
  days: OwnerTimingDays;
}

// the approved owner's weekly ONLINE times, every weekday in one request (the app's timings page)
export const GET = createGetRoute<OwnerTimings>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return { days: await getOwnerTimings(consultant.cid) };
  },
  { errorMessage: "failed to fetch" },
);
