import "server-only";

// prisma db
import prisma from "@/lib/database/db";

/**
 * this consultant's oath acceptance, null when not accepted. unlike the website's
 * getAuthStateById it doesn't catch, so a database error reaches the route as a 500
 * instead of reading as "not accepted"
 * @param cid the owner's own consultant id (from the session's consultant row)
 */
export const getOwnerOath = (cid: number) =>
  prisma.consultantOath.findUnique({
    where: { consultantId: cid },
    select: { acceptedAt: true },
  });
