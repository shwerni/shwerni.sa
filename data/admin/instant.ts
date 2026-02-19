"use server";
// lib
import prisma from "@/lib/database/db";
import { ConsultantState } from "@/lib/generated/prisma/enums";
// get all instant
export const getAllInstantAdmin = async () => {
  try {
    // get all instant
    const instant = await prisma.instant.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    // cis
    const cids = [...new Set(instant.map((i) => i.consultantId))];

    // owners
    const owners = await prisma.consultant.findMany({
      where: {
        cid: { in: cids },
        statusA: ConsultantState.PUBLISHED,
      },
    });

    // all owners
    const allOwners = owners.map((owner) => {
      const match = instant.find((i) => i.consultantId === owner.cid);
      return {
        ...owner,
        online_at: match?.online_at || null,
        cost: match?.cost || null,
      };
    });

    // return instant
    return allOwners;
  } catch {
    return null;
  }
};
