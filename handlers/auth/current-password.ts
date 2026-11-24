import "server-only";

// packages
import bcrypt from "bcryptjs";

// lib
import { rateLimit, type RateLimitConfig } from "@/lib/rate-limit";

// prisma data
import { getPasswordHash } from "@/data/password-change";

// tries of the current password per account (website settings and the app share it): a stolen
// session can't guess its way to a password change
export const PASSWORD_CHANGE_LIMIT: RateLimitConfig = { limit: 5, window: "15 m" };

export type CurrentPasswordCheck = "ok" | "wrong" | "rate_limited";

/**
 * the current password, before a logged-in password change (a reset by otp doesn't use this).
 * an account without a password can't confirm one: "wrong" (it resets by otp instead)
 * @param userId the session's user
 * @param currentPassword what the form sent
 */
export async function checkCurrentPassword(
  userId: string,
  currentPassword: string,
): Promise<CurrentPasswordCheck> {
  if (!(await rateLimit(`password-change:${userId}`, PASSWORD_CHANGE_LIMIT)))
    return "rate_limited";

  const hash = await getPasswordHash(userId);
  if (!hash) return "wrong";

  return (await bcrypt.compare(currentPassword, hash)) ? "ok" : "wrong";
}
