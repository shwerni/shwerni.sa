import "server-only";

// packages
import { cache } from "react";

// prisma db
import prisma from "@/lib/database/db";

/**
 * is this account deleted (anonymized)? read once per request (react cache). the session helpers
 * (userServer, roleServer, requireMobileUser) refuse a deleted account, since a website session is
 * a jwt that can't be revoked
 */
export const isAccountDeleted = cache(async (userId: string): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { deletedAt: true },
  });
  return !!user?.deletedAt;
});
