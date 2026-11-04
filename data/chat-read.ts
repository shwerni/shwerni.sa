import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

/**
 * mark one side of a meeting's chat as read up to `until`: the read time only moves forward and
 * never past the server's now, so a message that arrives between the reader's poll and this call
 * stays unread. one conditional update (no read-then-write race). used by the app's read routes and
 * the website's chat page
 * @param mid the meeting id (already checked to be the reader's)
 * @param reader USER = the client's side (clientReadAt), OWNER = the consultant's (ownerReadAt)
 * @param until the newest message time the reader saw
 * @returns the side's read time after the call (null when the meeting is gone)
 */
export const markChatRead = async (mid: string, reader: UserRole, until: Date) => {
  const now = new Date();
  const target = until < now ? until : now;
  const field = reader === UserRole.OWNER ? "ownerReadAt" : "clientReadAt";

  await prisma.meeting.updateMany({
    where: { mid, OR: [{ [field]: null }, { [field]: { lt: target } }] },
    data: { [field]: target },
  });

  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    select: { clientReadAt: true, ownerReadAt: true },
  });

  return meeting ? meeting[field] : null;
};
