"use server";
// prisma db
import prisma from "@/lib/database/db";

// get get pre consultation seassion
export const getPreConsultationSeassion = async (id: string) => {
  try {
    const seassion = await prisma.preConsultation.findUnique({
      where: { id },
    });
    return seassion;
  } catch {
    return null;
  }
};

// get get pre consultation seassion
export const getPreConsultationSeassionByPid = async (pid: number) => {
  try {
    const seassion = await prisma.preConsultation.findUnique({
      where: { pid },
    });
    return seassion;
  } catch {
    return null;
  }
};

// get get pre consultation seassion
export const getAllPreConsultationSeassionAdmin = async () => {
  try {
    const seassion = await prisma.preConsultation.findMany({
      orderBy: {
        created_at: "desc",
      },
    });
    return seassion;
  } catch {
    return null;
  }
};
