import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// types
import type { DbTx } from "@/lib/database/tx";

/**
 * the account's website password hash (bcrypt), for checking the current password. server only:
 * it never leaves the handler that compares it
 * @param userId the account
 * @returns the hash, or null when the account has none
 */
export const getPasswordHash = async (userId: string) =>
  (
    await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true },
    })
  )?.password ?? null;

/**
 * ends the user's app sessions after a password change: every MobileSession row but the one of the
 * device that made the change (none for a website change or a logged-out reset)
 * @param userId the account
 * @param keepSessionId the current app session, when the change came from a logged-in app
 * @param db the transaction, when inside one
 */
export const endOtherAppSessions = (
  userId: string,
  keepSessionId?: string,
  db: DbTx | typeof prisma = prisma,
) =>
  db.mobileSession.deleteMany({
    where: { userId, ...(keepSessionId ? { id: { not: keepSessionId } } : {}) },
  });

/**
 * the app's own login password (better-auth's MobileAccount credential) follows a change made
 * outside better-auth, so the old password stops working in the app too. only an existing
 * credential is updated: an account without one signs in to the app by the legacy login, which
 * copies the (new) website password on first use
 * @param userId the account
 * @param appHash better-auth's hash of the new password (lib/auth/password.ts hashAppPassword)
 * @param db the transaction, when inside one
 */
export const updateAppPassword = (
  userId: string,
  appHash: string,
  db: DbTx | typeof prisma = prisma,
) =>
  db.mobileAccount.updateMany({
    where: { userId, providerId: "credential" },
    data: { password: appHash },
  });

/**
 * saves a changed password and stamps passwordChangedAt, in one transaction with the end of the
 * other app sessions. website logins from before the stamp are refused by the session checks
 * (data/account-state.ts)
 * @param userId the account
 * @param hashedPassword the new website hash (bcrypt, users.password)
 * @param keepSessionId the current app session to keep, when the change came from the app
 * @param appHash the new app hash, when the app's login must follow too (better-auth's own reset
 *   already saved it, so it passes none)
 */
export const savePasswordChange = (
  userId: string,
  hashedPassword: string,
  keepSessionId?: string,
  appHash?: string,
) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
    if (appHash) await updateAppPassword(userId, appHash, tx);
    await endOtherAppSessions(userId, keepSessionId, tx);
  });
