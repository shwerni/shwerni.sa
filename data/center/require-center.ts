import "server-only";
// prisma db
import { prismaAll } from "@/lib/database/db";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { CenterMemberRole, UserRole } from "@/lib/generated/prisma/enums";

// thrown when the visitor isn't a signed-in member of a center
export class CenterAccessError extends Error {
  constructor(reason: string) {
    super(`center access denied: ${reason}`);
    this.name = "CenterAccessError";
  }
}

export type CenterContext = {
  userId: string;
  // Center.ceid
  centerId: number;
  memberRole: CenterMemberRole;
};

// the center a user belongs to (one center per account), or null
export const getCenterMembership = async (userId: string) => {
  try {
    return await prismaAll.centerMember.findUnique({
      where: { userId },
      select: { centerId: true, role: true },
    });
  } catch {
    return null;
  }
};

// centers spec §11.1: session user → role CENTER → CenterMember → a finite centerId.
// throws otherwise. every center data function and action takes its centerId from here only,
// never from client input (prisma drops undefined filters, which would read every center)
export const requireCenter = async (): Promise<CenterContext> => {
  const user = await userServer();
  if (!user?.id) throw new CenterAccessError("no session");
  if (user.role !== UserRole.CENTER) throw new CenterAccessError("not a center account");

  const member = await getCenterMembership(user.id);
  if (!member) throw new CenterAccessError("no center membership");
  if (!Number.isFinite(member.centerId))
    throw new CenterAccessError("invalid center id");

  return { userId: user.id, centerId: member.centerId, memberRole: member.role };
};
