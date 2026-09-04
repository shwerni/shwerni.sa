// packages
import { randomUUID } from "node:crypto";

// utils
import prisma from "@/lib/database/db";
import { getPresence } from "@/lib/api/room/get-presence";
import { dispatchIncomingCall } from "@/lib/api/room/dispatch";
import { sendPushNotifications } from "@/lib/notifications/mobile/mobile-push";

interface Counterpart {
  id: string;
  name: string;
  image: string | null;
}

type RingOutcome = "skipped-in-room" | "skipped-on-screen" | "banner" | "rung";

// decides and dispatches whatever this one participant needs, given who
// they're meeting. forceRing skips the presence check entirely and
// always sends a real voip ring — used by the t+5min recall, never by
// the t+0 ring
export const ringParticipant = async (
  mid: string,
  targetUserId: string,
  counterpart: Counterpart,
  forceRing: boolean,
): Promise<RingOutcome> => {
  // already actively connected — nothing to do, checked first regardless
  // of forceRing since there's never a reason to ring someone already on
  // the call
  const openSession = await prisma.participantSession.findFirst({
    where: {
      participant: { meetingId: mid, participant: targetUserId },
      leftAt: null,
    },
  });
  if (openSession) return "skipped-in-room";

  if (!forceRing) {
    const presence = await getPresence(targetUserId, mid);

    // already looking at this exact meeting's screen (waiting or
    // pre-join) — the screen updates itself once the window opens,
    // nothing external needs to reach them
    if (presence.onThisMeeting) return "skipped-on-screen";

    if (presence.online) {
      // foregrounded elsewhere in the app — a real voip push here would
      // force an unwanted callkit ring on top of whatever they're doing.
      // uses the existing expo push pipeline; the client intercepts this
      // specific notification type while foregrounded to show a
      // ring-like banner instead of the default system notification
      const tokens = await prisma.pushToken.findMany({
        where: { userId: targetUserId },
      });

      await sendPushNotifications(
        tokens.map((t) => ({
          to: t.token,
          title: "مكالمة واردة",
          body: `${counterpart.name} في انتظارك الآن`,
          data: {
            type: "incoming_call_banner",
            meetingMid: mid,
            callerName: counterpart.name,
            callerImage: counterpart.image,
          },
          priority: "high" as const,
          sound: "default" as const,
        })),
      );
      return "banner";
    }
  }

  // offline, or a forced recall — real voip ring
  await dispatchIncomingCall(targetUserId, {
    eventId: randomUUID(),
    serverCallId: mid,
    hasVideo: false,
    startedAt: new Date().toISOString(),
    caller: {
      id: counterpart.id,
      displayName: counterpart.name,
      avatarUrl: counterpart.image ?? undefined,
    },
  });
  return "rung";
};
