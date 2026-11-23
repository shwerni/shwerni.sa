import "server-only";

// prisma data
import { getMeetingAccess } from "@/data/chats";
import { ensureMeetingParticipant } from "@/data/rooms";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

export type MeetingViewer =
  | { side: "client"; role: typeof UserRole.USER; participant: string }
  | { side: "consultant"; role: typeof UserRole.OWNER; participant: string };

type Access = NonNullable<Awaited<ReturnType<typeof getMeetingAccess>>>;

// a consultant with no user account (a center consultant) can't log in: his token keeps working
// alone, as before, and every use is logged (decided by ziad, backlog: a login path for them)
const accountless = (access: Access, mid: string, where: string) => {
  if (access.orders.consultant.userId) return false;
  console.warn(`[meeting-access] accountless consultant token used mid=${mid} via=${where}`);
  return true;
};

/**
 * who is opening a meeting's page (/meetings, /chats, /dashboard/chats), by the standing rule
 * (CLAUDE.md): a client is their own USER token (the link is the access, no login); the
 * consultant is his login session and ownership of the order, never a token. an OWNER token in
 * the url (old links) or no token at all leads to the consultant path, and the consultant's token
 * then comes from the database, never from the url
 * @param mid the meeting
 * @param token the participant token from the link, if any
 * @param where the page, for the accountless consultant log
 * @returns the viewer, "login" when the consultant path has no session, or null (refused: a
 * missing meeting, an unknown token, or a session that isn't this order's consultant)
 */
export async function meetingViewer(
  mid: string,
  token: string | null | undefined,
  where: string,
): Promise<MeetingViewer | "login" | null> {
  const access = await getMeetingAccess(mid);
  if (!access) return null;

  const row = token ? access.participants.find((p) => p.participant === token) : undefined;
  if (token && !row) return null;

  if (row && row.role !== UserRole.OWNER) {
    return { side: "client", role: UserRole.USER, participant: row.participant };
  }

  if (row && accountless(access, mid, where)) {
    return { side: "consultant", role: UserRole.OWNER, participant: row.participant };
  }

  const user = await userServer();
  if (!user?.id) return "login";
  if (access.orders.consultant.userId !== user.id) return null;

  const participant = await ensureMeetingParticipant(mid, UserRole.OWNER);
  return { side: "consultant", role: UserRole.OWNER, participant };
}

/**
 * the side a chat call acts as, from the token the chat page holds: a USER token is the client
 * (no login); an OWNER token is the consultant only with his session on this order (an OWNER
 * token alone is refused, except for an accountless consultant, logged)
 * @param mid the meeting
 * @param token the caller's participant token
 * @param where the endpoint, for the accountless consultant log
 * @returns USER, OWNER or null (refused, looks like a missing meeting)
 */
export async function chatSide(
  mid: string,
  token: unknown,
  where: string,
): Promise<typeof UserRole.USER | typeof UserRole.OWNER | null> {
  if (typeof mid !== "string" || !mid || typeof token !== "string" || !token) return null;

  const access = await getMeetingAccess(mid);
  const row = access?.participants.find((p) => p.participant === token);
  if (!access || !row) return null;

  if (row.role !== UserRole.OWNER) return UserRole.USER;
  if (accountless(access, mid, where)) return UserRole.OWNER;

  const user = await userServer();
  return user?.id && access.orders.consultant.userId === user.id ? UserRole.OWNER : null;
}
