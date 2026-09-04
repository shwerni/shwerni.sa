// packages
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";
import { createPostRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";
import { dispatchIncomingCall } from "@/lib/api/room/dispatch";

// dynamic segment params
interface Params {
  mid: string;
}

// same guard order as POST /calls, since ringing needs the same
// authorization — then sends a voip push to whichever side isn't the
// caller, using the meeting mid as the push's serverCallId
export const POST = createPostRoute<unknown, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: {
        mid: true,
        done: true,
        blocked: true,
        orders: {
          select: {
            author: true,
            name: true,
            payment: { select: { payment: true } },
            consultant: {
              select: { userId: true, name: true, image: true },
            },
          },
        },
      },
    });

    if (!meeting) throw new HttpError("meeting not found", 404);
    if (meeting.blocked) throw new HttpError("meeting is blocked", 403);
    if (meeting.done) throw new HttpError("meeting already ended", 409);
    if (meeting.orders?.payment?.payment !== PaymentState.PAID) {
      throw new HttpError("order is not paid", 403);
    }

    const isConsultant = meeting.orders.consultant.userId === user.id;
    const isClient = meeting.orders.author === user.id;
    if (!isConsultant && !isClient) {
      throw new HttpError("not a participant", 403);
    }

    // ring whichever side isn't the caller
    const targetUserId = isConsultant
      ? meeting.orders.author
      : meeting.orders.consultant.userId;
    const callerName = isConsultant
      ? meeting.orders.consultant.name
      : meeting.orders.name;
    const callerImage = isConsultant ? meeting.orders.consultant.image : null;

    const rung = await dispatchIncomingCall(targetUserId, {
      eventId: randomUUID(),
      serverCallId: mid,
      hasVideo: false,
      startedAt: new Date().toISOString(),
      caller: {
        id: user.id,
        displayName: callerName,
        avatarUrl: callerImage ?? undefined,
      },
    });

    return { rung };
  },
);
