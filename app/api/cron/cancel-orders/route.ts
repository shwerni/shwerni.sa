// React & Next
import { NextResponse } from "next/server";

// prisma data
import {
  cancelOrders,
  markPaidOrdersWithoutRoom,
} from "@/data/order/reserveation";
import {
  cancelUnpaidHeldInstantOrders,
  holdStaleInstantOrders,
} from "@/data/instant-payment";

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

    // instant: still NEW / PROCESSING past the 5-minute payment window → HOLD, as a booking
    // does (the backstop when nobody books that consultant). never stops the cancel below
    const heldInstant = await holdStaleInstantOrders().catch((err) => {
      console.error("[cron] cancel-orders: instant hold failed", err);
      return null;
    });

    // find all orders still processing past the deadline
    const cancelled = await cancelOrders(deadline);

    // instant: put on HOLD for a passed window and never paid → CANCELED after the same 20 minutes
    const cancelledInstant = await cancelUnpaidHeldInstantOrders(deadline).catch(
      (err) => {
        console.error("[cron] cancel-orders: instant cancel failed", err);
        return null;
      },
    );
    if (heldInstant || cancelledInstant)
      console.log(
        `[cron] cancel-orders: instant held=${heldInstant ?? "-"} cancelled=${cancelledInstant ?? "-"}`,
      );

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
