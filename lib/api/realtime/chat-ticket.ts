import "server-only";

// packages
import { SignJWT } from "jose";
import { createHmac } from "crypto";

const secret = new TextEncoder().encode(process.env.REALTIME_JWT_SECRET);

// the consultant's opaque presence key (never a user id to the app); the realtime server derives
// the same key from the same secret
export const peerKey = (userId: string) =>
  createHmac("sha256", process.env.REALTIME_JWT_SECRET ?? "")
    .update(`peer:${userId}`)
    .digest("hex")
    .slice(0, 16);

/**
 * the chat-join ticket for one meeting's chat (realtime-chat-plan.md section 12): 60 seconds,
 * the signed-in user as sub, side = the role of that user's connection token (USER on the client
 * route, OWNER on the owner route). the client's ticket carries the consultant's presence key and
 * their last seen time (UserPresence) when the consultant has a user; the owner's carries neither
 */
export async function mintChatTicket(input: {
  userId: string;
  mid: string;
  side: "USER" | "OWNER";
  peer?: { userId: string; lastSeenAt: Date | null } | null;
}): Promise<string> {
  const claims: Record<string, unknown> = { mid: input.mid, side: input.side };
  if (input.side === "USER" && input.peer) {
    claims.peer = peerKey(input.peer.userId);
    claims.peerLastSeenAt = input.peer.lastSeenAt?.getTime() ?? null;
  }

  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setAudience("chat-join")
    .setIssuer("shwerni-next")
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(secret);
}
