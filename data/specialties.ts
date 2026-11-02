import "server-only";
import prisma from "@/lib/database/db";

export const getSpecialties = async () => {
  return (await prisma.specialty.findMany()) || [];
};


export async function getConsultantSpecialties(auther: string) {
  const consultant = await prisma.consultant.findUnique({
    where: { userId: auther },
    select: { cid: true, category: true },
  });

  if (!consultant) return null;

  const specialties = await prisma.specialty.findMany({
    where: { category: consultant.category },
    select: {
      id: true,
      name: true,
    },
  });

  const selected = await prisma.consultantSpecialty.findMany({
    where: { consultantId: consultant.cid },
    select: {
      specialtyId: true,
    },
  });

  return {
    cid: consultant.cid,
    category: consultant.category,
    selected: selected.map((i) => i.specialtyId),
    specialties,
  };
}

export async function updateConsultantSpecialties(
  cid: number,
  selectedIds: string[],
) {
  // replace the selection in one transaction, so a failure never leaves the consultant with none
  await prisma.$transaction([
    prisma.consultantSpecialty.deleteMany({
      where: { consultantId: cid },
    }),

    prisma.consultantSpecialty.createMany({
      data: selectedIds.map((id) => ({
        consultantId: cid,
        specialtyId: id,
      })),
    }),
  ]);
}
