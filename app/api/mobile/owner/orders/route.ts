// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerOrders, type OwnerOrderSession } from "@/data/mobile/owner-orders";

// the same range rule as GET /owner/sessions
const MAX_RANGE_DAYS = 42;
const DAY_MS = 86_400_000;

interface OwnerOrdersResponse {
  sessions: OwnerOrderSession[];
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

// the approved owner's order history by day: every meeting of their paid orders in a range of
// riyadh days, past or future. a separate route, so GET /owner/sessions stays as it is
export const GET = createGetRoute<OwnerOrdersResponse>(
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

    return { sessions: await getOwnerOrders(consultant.cid, from!, to!) };
  },
  { errorMessage: "failed to fetch" },
);
