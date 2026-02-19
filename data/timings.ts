"use server";
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

// is times exist
// export const isOwnersTimesExistByCid = async (consultantId: number) => {
//   try {
//     // get current times
//     const times = await prisma.consultantTiming.findFirst({
//       where: { consultantId },
//       select: { consultantId: true },
//     });
//     // return
//     return Boolean(times);
//   } catch {
//     // return
//     return undefined;
//   }
// };

// get times
export const getTimingsByCid = async (cid: number) => {
  try {
    // get current times
    const times = await prisma.consultantTiming.findFirst({
      where: { consultantId: cid },
    });
    // return
    return times;
  } catch {
    // return
    return undefined;
  }
};

// get times by day and cid
export const getTimingsDayByCid = async (cid: number, day: Weekday) => {
  try {
    // get current times
    const times = await prisma.consultantTiming.findMany({
      where: { consultantId: cid, day },
      select: { time: true },
    });
    // return
    if (times) {
      return times.map((t) => t.time) as string[];
    } else {
      return undefined;
    }
  } catch {
    // return
    return undefined;
  }
};

// get times by day and cid
export const getTimingsReservation = async (
  consultantId: number,
  today: string,
  now: string,
  day: string,
  date: string
): Promise<string[]> => {
  try {
    const result = await prisma.$queryRawUnsafe<{ time: string }[]>(
      `
      SELECT ct.time
      FROM consultant_timings ct
      WHERE ct.type = 'ONLINE'
        AND ct."consultantId" = $1
        AND ct.day = $2::"Weekday"
        AND (
          $3 != $4 -- future date, include all times
          OR ($3 = $4 AND ct.time > $5) -- today, only future times
        )
        AND NOT EXISTS (
          SELECT 1
          FROM meetings m
          JOIN orders o ON m."orderId" = o.oid
          JOIN payments p ON o.oid = p."orderId"
          WHERE m.date = $3
            AND m.time = ct.time
            AND o."consultantId" = $1
            AND p.payment IN ('NEW', 'PROCESSING', 'PAID')
        )
      ORDER BY ct.time;
      `,
      consultantId,
      day,
      date,
      today,
      now
    );

    return result.map((r) => r.time);
  } catch {
    return [];
  }
};
