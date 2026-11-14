import "server-only";

// prisma db
import prisma from "@/lib/database/db";

/**
 * the consultant of a meeting's chat, for the client's join ticket: their user id (null for a
 * center consultant without a user) and their last seen time (UserPresence, null when unknown).
 * the caller has already checked the client's access to the meeting
 */
export async function getChatPeer(
  mid: string,
): Promise<{ userId: string; lastSeenAt: Date | null } | null> {
  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    select: { orders: { select: { consultant: { select: { userId: true } } } } },
  });
  const userId = meeting?.orders.consultant?.userId;
  if (!userId) return null;

  const presence = await prisma.userPresence.findUnique({
    where: { userId },
    select: { lastSeenAt: true },
  });
  return { userId, lastSeenAt: presence?.lastSeenAt ?? null };
}
