// packages
import { SignJWT } from "jose";

const secret = new TextEncoder().encode(process.env.REALTIME_JWT_SECRET);

export async function mintRealtimeToken(userId: string, role: "USER" | "OWNER" | "GUEST") {
  return new SignJWT({ userId, role })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("60s")
    .sign(secret);
}