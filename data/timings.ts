import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { TimingType, Weekday } from "@/lib/generated/prisma/enums";

// save times
export const updateTimings = async (
  userId: string,
  consultantId: number,
  day: Weekday,
  times: string[],
  type: TimingType = "ONLINE"
) => {
  try {
    // delete old day timings
    await prisma.consultantTiming.deleteMany({
      where: {
        consultantId,
        day,
        type,
      },
    });

    // update
    await prisma.consultantTiming.createMany({
      data: times.map((time) => ({
        userId,
        consultantId,
        day,
        time,
        type,
      })),
    });

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// get times
export const getTimings = async (
  userId: string,
  consultantId: number,
  day: Weekday
) => {
  try {
    // get current times
    const times = await prisma.consultantTiming.findMany({
      where: { userId, consultantId, day },
    });

    // validate
    if (!times) return null;

    // return
    return times.map((t) => t.time);
  } catch {
    // return
    return null;
  }
};
