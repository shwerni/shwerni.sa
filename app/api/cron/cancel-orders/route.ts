// React & Next
import { NextResponse } from "next/server";

// prisma data
import {
  cancelOrders,
  markPaidOrdersWithoutRoom,
} from "@/data/order/reserveation";

// lib
import { isCronRequest } from "@/lib/api/routes/cron-auth";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) => isCronRequest(req);

export async function GET(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    // deadline — orders older than 20 minutes
    const deadline = new Date(Date.now() - 20 * 60000);

    // find all orders still processing past the deadline
    const cancelled = await cancelOrders(deadline);

    // the safety net: paid orders (last 3 days, older than 15 minutes) with no session room.
    // one admin alert per order (the marker is written by the same query); nothing is fixed
    const unfinished = await markPaidOrdersWithoutRoom(
      new Date(Date.now() - 3 * 24 * 60 * 60000),
      new Date(Date.now() - 15 * 60000),
    );
    if (unfinished === null)
      console.error("[cron] cancel-orders: the paid-without-room check failed");
    for (const oid of unfinished ?? [])
      await telegramAdmin(`طلب مدفوع بدون جلسة — #${oid}`);

    // valdiate
    if (cancelled === null)
      return NextResponse.json(
        { error: "failed - could not cancel orders" },
        { status: 500 },
      );
    // return
    return NextResponse.json({ cancelled });
  } catch {
    return NextResponse.json(
      { error: "failed - failed to cancel orders" },
      { status: 500 },
    );
  }
}
