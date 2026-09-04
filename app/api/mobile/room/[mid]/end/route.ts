// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import prisma from "@/lib/database/db";
import { createPostRoute } from "@/lib/api/routes/route-factory";

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

    return { success: true };
  },
);
