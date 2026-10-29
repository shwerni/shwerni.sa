// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerSessions, type OwnerSession } from "@/data/mobile/owner-sessions";

// the widest range the app may ask for (a month view with its leading / trailing days)
const MAX_RANGE_DAYS = 42;
const DAY_MS = 86_400_000;

interface OwnerSessionsResponse {
  sessions: OwnerSession[];
  // "YYYY-MM-DD" -> upcoming sessions that day (days without any are left out)
  days: Record<string, number>;
}

/**
 * a real calendar day as "YYYY-MM-DD" in ms (utc midnight, only used for the range length),
 * null for anything else (wrong format, or a day like 2026-02-30)
 * @param value query value
 */
const parseDay = (value: string | null) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(ms)) return null;
  return new Date(ms).toISOString().slice(0, 10) === value ? ms : null;
};

// the approved owner's paid sessions for a range of riyadh days (the app's sessions tab). the
// consultant always comes from the session, never from the query
export const GET = createGetRoute<OwnerSessionsResponse>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const params = request.nextUrl.searchParams;
    const from = params.get("from");
    const to = params.get("to");
    const fromMs = parseDay(from);
    const toMs = parseDay(to);
    if (
      fromMs === null ||
      toMs === null ||
      toMs < fromMs ||
      toMs - fromMs > MAX_RANGE_DAYS * DAY_MS
    ) {
      throw new HttpError("نطاق التاريخ غير صالح", 400);
    }

    const sessions = await getOwnerSessions(consultant.cid, from!, to!);

    const days: Record<string, number> = {};
    for (const session of sessions) {
      if (session.status === "upcoming") {
        days[session.date] = (days[session.date] ?? 0) + 1;
      }
    }

    return { sessions, days };
  },
  { errorMessage: "failed to fetch" },
);
