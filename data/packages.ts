"use server";

import prisma from "@/lib/database/db";
import { revalidatePath } from "next/cache";

// Update the base session costs for the consultant
export async function getConsultantsPackages(consultantId: number) {
  return await prisma.package.findMany({ where: { consultantId } });
}

export async function updateConsultantBaseCosts(
  cid: number,
  cost30: number,
  cost45: number,
  cost60: number,
) {
  try {
    await prisma.consultant.update({
      where: { cid },
      data: {
        cost30,
        cost45,
        cost60,
      },
    });

    // Refresh the page data
    revalidatePath("/dashboard/consultant");
    return { success: true };
  } catch (error) {
    console.error("Error updating base costs:", error);
    return { success: false };
  }
}

// Create or update a specific package (Upsert)
export async function upsertConsultantPackage(
  consultantId: number,
  count: number,
  cost: number,
  isActive: boolean,
) {
  try {
    await prisma.package.upsert({
      where: {
        consultantId_count: {
          consultantId,
          count,
        },
      },
      update: {
        cost,
        isActive,
      },
      create: {
        consultantId,
        count,
        cost,
        isActive,
      },
    });

    // Refresh the page data
    revalidatePath("/dashboard/consultant");
    return { success: true };
  } catch (error) {
    console.error("Error upserting package:", error);
    return { success: false };
  }
}
