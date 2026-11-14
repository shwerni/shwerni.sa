import "server-only";

// packages
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.REALTIME_JWT_SECRET);

const AUDIENCE = "chat-attachment";
const ISSUER = "shwerni-next";
const TTL = "30m";

export interface ChatAttachment {
  url: string;
  name: string | null;
  type: string | null;
}

/**
 * the signed attachment token the app's chat upload returns (realtime-chat-plan.md feature 3):
 * 30 minutes, the uploader as sub, the meeting and the file. the send routes take this token,
 * never a raw file url, so nobody can attach a file they didn't upload to that chat
 */
export async function mintChatAttachment(input: {
  userId: string;
  mid: string;
} & ChatAttachment): Promise<string> {
  return new SignJWT({ mid: input.mid, url: input.url, name: input.name, type: input.type })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(input.userId)
    .setAudience(AUDIENCE)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(TTL)
    .sign(secret);
}

/**
 * the file of an attachment token, or null: a bad signature, another audience or issuer, expired,
 * another user (sub) or another meeting (mid), or a file field that isn't what the upload wrote
 */
export async function readChatAttachment(
  token: string,
  expected: { userId: string; mid: string },
): Promise<ChatAttachment | null> {
  try {
    const { payload } = await jwtVerify(token, secret, {
      audience: AUDIENCE,
      issuer: ISSUER,
      algorithms: ["HS256"],
    });
    if (payload.sub !== expected.userId || payload.mid !== expected.mid) return null;

    const { url, name, type } = payload as { url?: unknown; name?: unknown; type?: unknown };
    if (typeof url !== "string" || !url.startsWith("https://") || url.length > 2048) return null;
    if (name !== null && typeof name !== "string") return null;
    if (type !== null && typeof type !== "string") return null;
    return { url, name, type };
  } catch {
    return null;
  }
}
