// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import prisma from "@/lib/database/db";
import { createPostRoute } from "@/lib/api/routes/route-factory";

// prisma data
import { writeMeetingLog } from "@/data/meeting-log";

// dynamic segment params
interface Params {
  mid: string;
}

// marks a meeting as actually over — this is the only place Meeting.done
// is set. deliberately not driven by livekit room lifecycle events, since
// an empty room doesn't mean the meeting is finished (see the webhook)
export const POST = createPostRoute<unknown, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: {
        // for the meeting log only
        done: true,
        orderId: true,
        session: true,
        orders: {
          select: {
            author: true,
            consultant: { select: { userId: true } },
          },
        },
      },
    });

    if (!meeting) throw new HttpError("meeting not found", 404);

    const isParticipant =
      meeting.orders.consultant.userId === user.id ||
      meeting.orders.author === user.id;
    if (!isParticipant) throw new HttpError("not a participant", 403);

    await prisma.meeting.update({
      where: { mid },
      data: { done: true },
    });

    // meeting log, only when done flipped; the actor is the mobile session user.
    // last step, and it never throws
    if (!meeting.done)
      await writeMeetingLog({
        meetingId: mid,
        orderId: meeting.orderId,
        session: meeting.session,
        action: "DONE",
        source: "SITE",
        actor: { id: user.id, name: user.name, role: user.role },
        before: { done: false },
        after: { done: true },
      });

    return { success: true };
  },
);
