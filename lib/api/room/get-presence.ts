// utils
import prisma from "@/lib/database/db";

// heartbeats older than this are treated as offline — a bit looser than
// the mobile heartbeat interval to absorb normal network jitter
const ONLINE_WINDOW_MS = 45_000;

interface PresenceStatus {
  online: boolean;
  onThisMeeting: boolean;
}

// answers both questions the ring job needs from one row: is this user
// currently foregrounded at all, and are they specifically already on
// this meeting's own screen (in which case nothing should be sent)
export const getPresence = async (
  userId: string,
  meetingMid: string,
): Promise<PresenceStatus> => {
  const row = await prisma.userPresence.findUnique({ where: { userId } });
  if (!row) return { online: false, onThisMeeting: false };

  const online = Date.now() - row.lastSeenAt.getTime() < ONLINE_WINDOW_MS;
  const onThisMeeting = online && row.meetingMid === meetingMid;

  return { online, onThisMeeting };
};
