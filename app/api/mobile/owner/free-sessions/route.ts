// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import {
  getOwnerFreeSessions,
  type OwnerFreeSessions,
} from "@/data/mobile/owner-free-sessions";

// the approved owner's weekly free-session switch and their upcoming free sessions
export const GET = createGetRoute<OwnerFreeSessions>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);
    return getOwnerFreeSessions(consultant.cid);
  },
  { errorMessage: "failed to fetch" },
);
