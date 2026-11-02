import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import type { Categories } from "@/lib/generated/prisma/enums";

// GET /api/mobile/owner/specialties
export interface OwnerSpecialties {
  category: Categories;
  specialties: { id: string; name: string }[];
  selected: string[];
}

/**
 * the consultant's category, its sub-specialties and the ones the consultant picked: the
 * website's getConsultantSpecialties, by the session's cid, without the cid in the result.
 * null when the row is gone (requireApprovedOwner found it a moment ago)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerSpecialties = async (
  cid: number,
): Promise<OwnerSpecialties | null> => {
  const consultant = await prisma.consultant.findUnique({
    where: { cid },
    select: { category: true },
  });
  if (!consultant) return null;

  const [specialties, selected] = await Promise.all([
    prisma.specialty.findMany({
      where: { category: consultant.category },
      select: { id: true, name: true },
    }),
    prisma.consultantSpecialty.findMany({
      where: { consultantId: cid },
      select: { specialtyId: true },
    }),
  ]);

  return {
    category: consultant.category,
    specialties,
    selected: selected.map((row) => row.specialtyId),
  };
};
