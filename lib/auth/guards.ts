import "server-only";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// hotfix guards for actions/: ids always come from the session, never from the caller

// the logged-in user, or null
export async function sessionUser() {
  const user = await userServer();
  return user?.id ? user : null;
}

// the logged-in consultant's own consultant id, or null for anyone else
export async function ownConsultantCid() {
  const user = await sessionUser();
  if (!user || user.role !== UserRole.OWNER) return null;

  const consultant = await getOwnerbyAuthor(user.id);
  return consultant?.cid ?? null;
}

// true only for a logged-in consultant
export async function isConsultant() {
  const user = await sessionUser();
  return user?.role === UserRole.OWNER;
}
