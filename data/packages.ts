"use server";
// React & Next
import { revalidatePath } from "next/cache";

// prisma db
import prisma from "@/lib/database/db";

// get consultant packages
export async function getConsultantsPackages(
  consultantId: number,
  status?: boolean,
) {
  return await prisma.package.findMany({
    where: { consultantId, isActive: status },
  });
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
  } catch {
    return { success: false };
  }
}

// create or update a specific package (Upsert)
export async function upsertConsultantPackage(
  consultantId: number,
  count: number,
  cost: number,
  isActive: boolean,
) {
  try {
    await prisma.package.upsert({
      where: { consultantId_count: { consultantId, count } },
      update: { cost, isActive },
      create: { consultantId, count, cost, isActive },
    });

    // if activating, enforce max 3 active packages
    if (isActive) {
      const activePackages = await prisma.package.findMany({
        where: { consultantId, isActive: true },
        orderBy: { updated_at: "asc" }, // oldest updated = last one toggled on
        select: { id: true },
      });

      // if more than 3 active, deactivate the oldest ones
      if (activePackages.length > 3) {
        const toDeactivate = activePackages
          .slice(0, activePackages.length - 3) // everything except the 3 most recent
          .map((p) => p.id);

        await prisma.package.updateMany({
          where: { id: { in: toDeactivate } },
          data: { isActive: false },
        });
      }
    }

    revalidatePath("/dashboard/consultant");
    return { success: true };
  } catch (error) {
    console.error("Error upserting package:", error);
    return { success: false };
  }
}
