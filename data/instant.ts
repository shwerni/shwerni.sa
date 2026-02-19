"use server";

import prisma from "@/lib/database/db";

// prisma db

// get all instant owners
export const getAllInstantOwners = async () => {
  try {
    const instant = await prisma.instant.findMany({
      where: {
        status: true,
        online_at: {
          gte: new Date(Date.now() - 30 * 1000),
        },
      },
    });
    return instant;
  } catch {
    return null;
  }
};

// get all instant owners
export const getOfficialInstantOwners = async () => {
  try {
    // get instant
    const instant = await prisma.instant.findMany({
      where: {
        statusA: true,
        online_at: {
          gte: new Date(Date.now() - 30 * 1000),
        },
      },
    });

    // validate
    if (!instant || instant.length == 0) return null;

    // return
    return instant;
  } catch {
    return null;
  }
};

// control officials
export const updateOfficialInstantState = async (
  cid: number,
  statusA: boolean,
) => {
  try {
    const instant = await prisma.instant.update({
      where: { consultantId: cid },
      data: { statusA },
    });
    return instant;
  } catch {
    return null;
  }
};

// get all instant owners
export const getInstantOwnerByAuthor = async (author: string) => {
  try {
    const instant = await prisma.instant.findUnique({
      where: { userId: author },
    });
    return instant;
  } catch {
    return null;
  }
};

// switch owner to active
export const UpdateInstantOwnerState = async (
  author: string,
  cid: number,
  status: boolean,
  cost: number,
) => {
  try {
    // get owner instant
    const instant = await prisma.instant.findUnique({
      where: { userId: author },
    });

    // create
    if (!instant) {
      const newInstant = await prisma.instant.create({
        data: { userId: author, consultantId: cid, status, cost },
      });
      // return
      return newInstant;
    }

    // update if exist
    const update = await prisma.instant.update({
      where: { userId: author },
      data: { status, cost },
    });
    // return
    return update;
  } catch {
    return null;
  }
};

export const updateOnlineAt = async (author: string) => {
  try {
    const instant = await prisma.instant.findUnique({
      where: { userId: author },
    });

    if (instant && instant.status) {
      await prisma.instant.update({
        where: { userId: author },
        data: { online_at: new Date() },
      });
    }
  } catch (error) {
    return null;
  }
};
