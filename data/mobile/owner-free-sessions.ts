import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// utils
import { getWeekStartSaturday, timeZone } from "@/utils/date";

// a free session stays listed (and joinable) until 35 minutes after its start
const JOIN_WINDOW_MS = 35 * 60_000;

// GET /api/mobile/owner/free-sessions
export interface OwnerFreeSessions {
  enabled: boolean;
  sessions: { fid: number; date: string; time: string; duration: number }[];
}

/**
 * the weekly free-session switch and the consultant's free sessions that aren't over yet.
 * enabled: the website's rule (components/legacy/consultants/owner/freeSession: status and
 * activeWeek is this week's riyadh saturday). sessions: start + 35 minutes >= now, soonest first;
 * never name, phone, author, url or info
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param now the current time in ms
 */
export const getOwnerFreeSessions = async (
  cid: number,
  now: number = Date.now(),
): Promise<OwnerFreeSessions> => {
  // riyadh day before today: a session from late yesterday can still be in its window
  const since = new Date(now + 3 * 3_600_000 - 86_400_000).toISOString().slice(0, 10);

  const [timings, rows] = await Promise.all([
    prisma.freeTimings.findUnique({
      where: { consultantId: cid },
      select: { status: true, activeWeek: true },
    }),
    prisma.freeSession.findMany({
      where: { consultantId: cid, date: { gte: since } },
      select: { fid: true, date: true, time: true, duration: true },
    }),
  ]);

  const weekStart = getWeekStartSaturday(timeZone().iso);
  const enabled =
    !!timings?.status && timings.activeWeek?.getTime() === weekStart.getTime();

  const sessions = rows
    .map((row) => ({ row, start: Date.parse(`${row.date}T${row.time}:00+03:00`) }))
    .filter(({ start }) => Number.isFinite(start) && start + JOIN_WINDOW_MS >= now)
    .sort((a, b) => a.start - b.start)
    .map(({ row }) => ({
      fid: row.fid,
      date: row.date,
      time: row.time,
      duration: Number(row.duration) || 0,
    }));

  return { enabled, sessions };
};

/**
 * whether this free session belongs to the consultant (the link route answers 404 otherwise)
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param fid the free session id from the url
 */
export const ownsFreeSession = async (cid: number, fid: number) =>
  !!(await prisma.freeSession.findFirst({
    where: { fid, consultantId: cid },
    select: { fid: true },
  }));
