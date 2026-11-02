// packages
import type { NextRequest } from "next/server";

// utils
import { HttpError } from "@/lib/api/http-error";
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireApprovedOwner } from "@/lib/auth/require-approved-owner";

// data
import { getOwnerDues, sumShare, type OwnerDue } from "@/data/mobile/owner-dues";

const PAGE_SIZE = 20;

interface OwnerDuesPage {
  total: { count: number; amount: number };
  months: string[];
  orders: OwnerDue[];
  nextCursor: string | null;
}

// the approved owner's dues (their share of every paid order) for a riyadh month of due_at or all
// time, 20 per page. money is computed on the server only; total covers the whole filter, so for
// "all" it equals GET /owner/dues/summary
export const GET = createGetRoute<OwnerDuesPage>(
  async (request: NextRequest) => {
    const { consultant } = await requireApprovedOwner(request);

    const params = request.nextUrl.searchParams;
    const month = params.get("month") ?? "all";
    const cursor = params.get("cursor");
    if (month !== "all" && !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      throw new HttpError("بيانات خاطئة", 400);
    }
    if (cursor !== null && !/^\d{1,10}$/.test(cursor)) {
      throw new HttpError("بيانات خاطئة", 400);
    }

    const rows = await getOwnerDues(consultant.cid);
    // newest first ("YYYY-MM" sorts as text)
    const months = [...new Set(rows.map((row) => row.month))].sort().reverse();
    const filtered = month === "all" ? rows : rows.filter((row) => row.month === month);

    // the page after the cursor's order; a cursor that isn't in this filter is a bad request
    let start = 0;
    if (cursor !== null) {
      const index = filtered.findIndex((row) => row.due.oid === Number(cursor));
      if (index === -1) throw new HttpError("بيانات خاطئة", 400);
      start = index + 1;
    }
    const page = filtered.slice(start, start + PAGE_SIZE).map((row) => row.due);
    const more = start + PAGE_SIZE < filtered.length;

    return {
      total: { count: filtered.length, amount: sumShare(filtered) },
      months,
      orders: page,
      nextCursor: more && page.length ? String(page[page.length - 1].oid) : null,
    };
  },
  { errorMessage: "failed to fetch" },
);
