// packages
import { AccessToken, TrackSource } from "livekit-server-sdk";
import type { NextRequest } from "next/server";

// utils
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";
import prisma from "@/lib/database/db";
import { createPostRoute } from "@/lib/api/routes/route-factory";

// body shape
interface Body {
  mid: string;
}

// create (or reuse) a livekit room for a meeting and mint a join token for
// the currently authed participant — identity is always server-derived,
// never trusted from the client. currently authorizes only the order's
// consultant or client; family/couple add-on joins are a separate flow
export const POST = createPostRoute(async (request: NextRequest) => {
  console.log("users");
  const user = await requireMobileUser(request);
  console.log(user);
  const { mid } = (await request.json()) as Body;
  console.log(mid);
  
  if (!mid) throw new HttpError("meeting id is required", 400);

  // load meeting with the fields needed to authorize and identify the caller
  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    select: {
      mid: true,
      done: true,
      blocked: true,
      orderId: true,
      orders: {
        select: {
          author: true,
          name: true,
          consultantId: true,
          payment: { select: { payment: true } },
          consultant: { select: { userId: true, name: true, image: true } },
        },
      },
    },
  });
  console.log(meeting);

  if (!meeting) throw new HttpError("meeting not found", 404);
  if (meeting.blocked) throw new HttpError("meeting is blocked", 403);
  if (meeting.done) throw new HttpError("meeting already ended", 409);
  if (meeting.orders?.payment?.payment !== PaymentState.PAID) {
    throw new HttpError("order is not paid", 403);
  }

  // only the client (order author) or the assigned consultant may join
  const isConsultant = meeting.orders.consultant.userId === user.id;
  const isClient = meeting.orders.author === user.id;
  if (!isConsultant && !isClient) {
    throw new HttpError("not a participant", 403);
  }

  // room name is stable per meeting so reconnects (interruptions) land in
  // the same livekit room instead of creating a new one
  const room = await prisma.room.upsert({
    where: { meetingId: mid },
    create: { meetingId: mid, roomId: mid, roomName: mid },
    update: {},
  });

  // ensure a participant row exists for attendance tracking — the livekit
  // webhook updates duration/attended, this call only guarantees the row
  await prisma.participant.upsert({
    where: { meetingId_participant: { meetingId: mid, participant: user.id } },
    create: {
      meetingId: mid,
      participant: user.id,
      role: isConsultant ? "OWNER" : "USER",
    },
    update: {},
  });

  // name/metadata ride along on the livekit participant so the mobile
  // client can render "مستشار" vs client cards without a second api call
  const token = new AccessToken(
    process.env.LIVEKIT_API_KEY,
    process.env.LIVEKIT_API_SECRET,
    {
      identity: user.id,
      name: isConsultant ? meeting.orders.consultant.name : meeting.orders.name,
      metadata: JSON.stringify({
        isConsultant,
        image: isConsultant ? meeting.orders.consultant.image : null,
      }),
      ttl: "10m",
    },
  );
  token.addGrant({
    room: room.roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: false,
    canSubscribe: true,
    canPublishSources: [TrackSource.MICROPHONE],
  });

  return {
    token: await token.toJwt(),
    roomName: room.roomName,
    wsUrl: process.env.LIVEKIT_URL,
    isConsultant,
    consultant: {
      name: meeting.orders.consultant.name,
      image: meeting.orders.consultant.image,
    },
  };
});
