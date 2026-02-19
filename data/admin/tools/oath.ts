"use server";
// prisma db
import prisma from "@/lib/database/db";

// check oath acceptance
export const getAuthStateById = async (userId: string) => {
  try {
    // get consultant
    const consultant = await prisma.consultant.findUnique({
      where: { userId },
      select: { cid: true },
    });

    // validate
    if (!consultant?.cid) return null;

    // oath
    const oath = await prisma.consultantOath.findUnique({
      where: { consultantId: consultant.cid },
    });

    return oath;
  } catch {
    return null;
  }
};

export async function confirmOathAcceptance(userId: string) {
  try {
    // get consultant
    const consultant = await prisma.consultant.findUnique({
      where: { userId },
      select: { cid: true },
    });

    // validate
    if (!consultant?.cid) return null;

    // oath
    await prisma.consultantOath.upsert({
      where: { consultantId: consultant.cid },
      update: {},
      create: {
        consultantId: consultant.cid,
      },
    });

    return true;
  } catch {
    return null;
  }
}
