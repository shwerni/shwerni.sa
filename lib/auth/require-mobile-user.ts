// React & Next
import type { NextRequest } from "next/server";

// auth
import { mobileAuth } from "@/lib/auth/mobile-auth";

// utils
import { HttpError } from "@/lib/api/http-error";

/**
 * resolves the signed-in mobile user from the request's session token
 * throws a 401 HttpError when there is no valid session - every notification
 * route uses this instead of trusting a client-supplied userId
 */
export async function requireMobileUser(request: NextRequest) {
  const sessionTokenHeader = request.headers.get("x-session-token");
  // console.log("[requireMobileUser] x-session-token present:", !!sessionTokenHeader);

  const headers = new Headers(request.headers);
  if (sessionTokenHeader) {
    headers.set("cookie", sessionTokenHeader);
  }

  const session = await mobileAuth.api.getSession({ headers });
  // console.log("[requireMobileUser] session result:", session ? `user=${session.user?.id}` : "null");

  if (!session?.user) {
    throw new HttpError("unauthorized", 401);
  }

  return session.user;
}
