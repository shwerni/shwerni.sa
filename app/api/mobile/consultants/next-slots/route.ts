// packages
import type { NextRequest } from "next/server";

// utils
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";
import { HttpError } from "@/lib/api/http-error";

// data
import { getNextSlots } from "@/data/mobile/next-slots";

// a consultant's earliest free slot, null when none in the booking window
type NextSlot = { date: string; time: string } | null;

// keyed by cid
type NextSlotsResponse = Record<number, NextSlot>;

const MAX_IDS = 30;
const CACHE_MS = 60_000;
const CACHE_LIMIT = 500;

// per-instance cache, keyed by the sorted cid list; slots change only when someone books,
// and the booking screen re-checks the real times anyway
const cache = new Map<string, { at: number; data: NextSlotsResponse }>();

/**
 * the "أقرب موعد" row of the app's consultant cards: earliest free slot per consultant,
 * same free-slot rule as GET /consultants/[cid]/times (freeSlotWhere)
 */
export const GET = createGetRoute<NextSlotsResponse>(
  async (request: NextRequest) => {
    await requireMobileUser(request);

    const parts = (request.nextUrl.searchParams.get("cids") ?? "")
      .split(",")
      .filter(Boolean);

    if (parts.length === 0 || parts.length > MAX_IDS) {
      throw new HttpError(`cids must hold 1 to ${MAX_IDS} ids`, 400);
    }

    const cids = [...new Set(parts.map(Number))].sort((a, b) => a - b);
    if (cids.some((cid) => !Number.isInteger(cid) || cid <= 0)) {
      throw new HttpError("cids must be positive integers", 400);
    }

    const key = cids.join(",");
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;

    const rows = await getNextSlots(cids);
    const data: NextSlotsResponse = Object.fromEntries(
      rows.map((row) => [
        row.cid,
        row.date && row.time ? { date: row.date, time: row.time } : null,
      ]),
    );

    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, { at: Date.now(), data });

    return data;
  },
  { errorMessage: "failed to fetch" },
);
