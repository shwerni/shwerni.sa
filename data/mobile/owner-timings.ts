import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { TimingType, Weekday } from "@/lib/generated/prisma/enums";

// GET /api/mobile/owner/timings -> days
export type OwnerTimingDays = Record<Weekday, string[]>;

/**
 * the consultant's weekly ONLINE times (the type the website saves), all 7 weekdays present,
 * "HH:mm" sorted, [] for a day without times. the website reads one day at a time (getTimings)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerTimings = async (cid: number): Promise<OwnerTimingDays> => {
  const rows = await prisma.consultantTiming.findMany({
    where: { consultantId: cid, type: TimingType.ONLINE },
    select: { day: true, time: true },
  });

  const days = Object.fromEntries(
    Object.values(Weekday).map((day) => [day, [] as string[]]),
  ) as OwnerTimingDays;
  for (const row of rows) days[row.day].push(row.time);
  for (const day of Object.values(Weekday)) days[day].sort();

  return days;
};
