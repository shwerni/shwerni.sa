import "server-only";

// packages
import { cache } from "react";

// prisma db
import prisma from "@/lib/database/db";

// the account fields the session checks read, once per request (react cache)
const getSessionGate = cache(async (userId: string) =>
  prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true, passwordChangedAt: true },
  }),
);

/**
 * is this account deleted (anonymized)? read once per request (react cache). the session helpers
 * (userServer, roleServer, requireMobileUser) refuse a deleted account, since a website session is
 * a jwt that can't be revoked
 */
export const isAccountDeleted = cache(async (userId: string): Promise<boolean> => {
  const user = await getSessionGate(userId);
  return !!user?.deletedAt;
});

/**
 * is this website login over? a website session is a jwt that can't be revoked, so it's refused
 * when the account is deleted, or when the password changed after the login (a reset or a change,
 * on the website or the app, signs out every login from before it). an account that never changed
 * its password (or has none) is never refused for it
 * @param userId the token's user
 * @param authAt the login time in ms (utils/login-time.ts); a missing one counts as before any change
 */
export const isWebLoginRevoked = async (
  userId: string,
  authAt: number | undefined,
): Promise<boolean> => {
  const user = await getSessionGate(userId);
  if (user?.deletedAt) return true;

  const changedAt = user?.passwordChangedAt?.getTime();
  if (changedAt === undefined) return false;

  return authAt === undefined || authAt < changedAt;
};
