// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";
import { consultantBusyPayload } from "@/lib/api/realtime/consultant-busy";

// data
import { getOwnerInstantOrders } from "@/data/mobile/owner-instant";

interface OwnerInstantState {
  busyUntil: number | null;
  booking: {
    orderId: number;
    meetingId: string;
    startsAt: string;
    duration: number;
  } | null;
}

// the instant tab's state after a kill or a push: the active paid instant session, and busy until
// it ends. busyUntil is worked out with consultantBusyPayload, the same math the payment sent to the
// realtime server (start + duration). instant sessions only, like the realtime server's refusal
export const GET = createGetRoute<OwnerInstantState>(
  async (request: NextRequest) => {
    const { user, consultant } = await requireApprovedOwner(request);
    const now = Date.now();
    const orders = await getOwnerInstantOrders(consultant.cid, now);

    for (const order of orders) {
      const payload = consultantBusyPayload(
        {
          oid: order.oid,
          consultant: { name: consultant.name, userId: user.id },
          meeting: order.meeting,
        },
        now,
      );
      if (!payload) continue;

      return {
        busyUntil: payload.busyUntil,
        booking: {
          orderId: payload.orderId,
          meetingId: payload.meetingId,
          startsAt: payload.startsAt,
          duration: payload.duration,
        },
      };
    }

    return { busyUntil: null, booking: null };
  },
  { errorMessage: "failed to fetch" },
);
