import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// types
import type { DbTx } from "@/lib/database/tx";

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
 * saves a changed password (the website's bcrypt hash) and stamps passwordChangedAt, in one
 * transaction with the end of the other app sessions. website logins from before the stamp are
 * refused by the session checks (data/account-state.ts)
 * @param userId the account
 * @param hashedPassword the new bcrypt hash
 * @param keepSessionId the current app session to keep, when the change came from the app
 */
export const savePasswordChange = (
  userId: string,
  hashedPassword: string,
  keepSessionId?: string,
) =>
  prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { password: hashedPassword, passwordChangedAt: new Date() },
    });
    await endOtherAppSessions(userId, keepSessionId, tx);
  });
