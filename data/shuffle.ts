"use server";
// prisma db
import prisma from "@/lib/database/db";

export const reshuffleConsultants = async () => {
  await prisma.$executeRaw`
    UPDATE "consultants"
    SET "sort_key" = RANDOM()
    WHERE "status" = true
      AND "statusA" = 'PUBLISHED'
      AND "approved" = 'APPROVED'
  `;

  return { success: true };
};
