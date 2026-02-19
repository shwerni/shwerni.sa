"use server";
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
  await prisma.consultantSpecialty.deleteMany({
    where: { consultantId: cid },
  });

  await prisma.consultantSpecialty.createMany({
    data: selectedIds.map((id) => ({
      consultantId: cid,
      specialtyId: id,
    })),
  });
}
