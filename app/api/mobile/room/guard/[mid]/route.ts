// packages
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";
import { timeZone } from "@/lib/site/time";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import prisma from "@/lib/database/db";

// dynamic segment params
interface Params {
  mid: string;
}

// returns meeting/authorization info needed to gate the call screen —
// does not mint a livekit token or touch the room, unlike POST /calls
export const GET = createGetRoute<unknown, Params>(
  async (request: NextRequest, context) => {
    const user = await requireMobileUser(request);
    const { mid } = await context.params;

    const meeting = await prisma.meeting.findUnique({
      where: { mid },
      select: {
        mid: true,
        date: true,
        time: true,
        duration: true,
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

    const isConsultant = meeting.orders.consultant.userId === user.id;
    const isClient = meeting.orders.author === user.id;
    if (!isConsultant && !isClient) {
      throw new HttpError("not a participant", 403);
    }

    // server clock, not the device's — the mobile page shouldn't decide
    // the join window against a clock it doesn't control
    const { date, time } = timeZone();

    return {
      mid: meeting.mid,
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      done: meeting.done,
      blocked: meeting.blocked,
      isPaid: meeting.orders.payment?.payment === PaymentState.PAID,
      isConsultant,
      consultant: {
        name: meeting.orders.consultant.name,
        image: meeting.orders.consultant.image,
      },
      client: {
        name: meeting.orders.name,
      },
      serverDate: date,
      serverTime: time,
    };
  },
);
