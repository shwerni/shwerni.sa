// packages
import { WebhookReceiver } from "livekit-server-sdk";

// utils
import prisma from "@/lib/database/db";

// ten minutes present marks a participant as attended
const ATTENDANCE_THRESHOLD_SECONDS = 600;

const receiver = new WebhookReceiver(
  process.env.LIVEKIT_API_KEY!,
  process.env.LIVEKIT_API_SECRET!,
);

// livekit calls this on room/participant lifecycle events — it is the
// single source of truth for attendance, never the client
export const POST = async (request: Request) => {
  const body = await request.text();
  const authorization = request.headers.get("Authorization") ?? "";

  // throws if the signature does not match, which rejects spoofed calls
  const event = await receiver.receive(body, authorization);

  const meetingId = event.room?.name;
  if (!meetingId) return new Response(null, { status: 200 });

  switch (event.event) {
    case "participant_joined": {
      const participant = event.participant?.identity;
      if (!participant) break;

      await prisma.participantSession.create({
        data: {
          joinedAt: new Date(),
          participant: {
            connect: {
              meetingId_participant: { meetingId, participant },
            },
          },
        },
      });
      break;
    }

    case "participant_left": {
      const participant = event.participant?.identity;
      if (!participant) break;

      const record = await prisma.participant.findUnique({
        where: { meetingId_participant: { meetingId, participant } },
        select: {
          id: true,
          duration: true,
          logs: {
            where: { leftAt: null },
            orderBy: { joinedAt: "desc" },
            take: 1,
          },
        },
      });

      const open = record?.logs[0];
      if (!record || !open) break;

      const leftAt = new Date();
      const elapsed = Math.floor(
        (leftAt.getTime() - open.joinedAt.getTime()) / 1000,
      );
      const totalDuration = record.duration + elapsed;

      await prisma.$transaction([
        prisma.participantSession.update({
          where: { id: open.id },
          data: { leftAt },
        }),
        prisma.participant.update({
          where: { id: record.id },
          data: {
            duration: totalDuration,
            attended: totalDuration >= ATTENDANCE_THRESHOLD_SECONDS,
          },
        }),
      ]);
      break;
    }

    case "room_finished": {
      // intentionally not marking the meeting done here — an empty
      // livekit room just means everyone disconnected right now (a hot
      // reload, backgrounding, or a real gsm interruption mid-reconnect),
      // not that the meeting is actually over. "done" is set explicitly
      // by POST /room/[mid]/end when the scheduled duration elapses
      break;
    }
  }

  return new Response(null, { status: 200 });
};

// // packages
// import { WebhookReceiver } from "livekit-server-sdk";

// // utils
// import prisma from "@/lib/database/db";

// // ten minutes present marks a participant as attended
// const ATTENDANCE_THRESHOLD_SECONDS = 600;

// const receiver = new WebhookReceiver(
//   process.env.LIVEKIT_API_KEY!,
//   process.env.LIVEKIT_API_SECRET!,
// );

// // livekit calls this on room/participant lifecycle events — it is the
// // single source of truth for attendance, never the client
// export const POST = async (request: Request) => {
//   const body = await request.text();
//   const authorization = request.headers.get("Authorization") ?? "";

//   // throws if the signature does not match, which rejects spoofed calls
//   const event = await receiver.receive(body, authorization);

//   const meetingId = event.room?.name;
//   if (!meetingId) return new Response(null, { status: 200 });

//   switch (event.event) {
//     case "participant_joined": {
//       const participant = event.participant?.identity;
//       if (!participant) break;

//       await prisma.participantSession.create({
//         data: {
//           joinedAt: new Date(),
//           participant: {
//             connect: {
//               meetingId_participant: { meetingId, participant },
//             },
//           },
//         },
//       });
//       break;
//     }

//     case "participant_left": {
//       const participant = event.participant?.identity;
//       if (!participant) break;

//       const record = await prisma.participant.findUnique({
//         where: { meetingId_participant: { meetingId, participant } },
//         select: {
//           id: true,
//           duration: true,
//           logs: {
//             where: { leftAt: null },
//             orderBy: { joinedAt: "desc" },
//             take: 1,
//           },
//         },
//       });

//       const open = record?.logs[0];
//       if (!record || !open) break;

//       const leftAt = new Date();
//       const elapsed = Math.floor(
//         (leftAt.getTime() - open.joinedAt.getTime()) / 1000,
//       );
//       const totalDuration = record.duration + elapsed;

//       await prisma.$transaction([
//         prisma.participantSession.update({
//           where: { id: open.id },
//           data: { leftAt },
//         }),
//         prisma.participant.update({
//           where: { id: record.id },
//           data: {
//             duration: totalDuration,
//             attended: totalDuration >= ATTENDANCE_THRESHOLD_SECONDS,
//           },
//         }),
//       ]);
//       break;
//     }

//     case "room_finished": {
//       await prisma.meeting.update({
//         where: { mid: meetingId },
//         data: { done: true },
//       });
//       break;
//     }
//   }

//   return new Response(null, { status: 200 });
// };
