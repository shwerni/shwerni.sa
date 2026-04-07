// React & Next
import { NextResponse } from "next/server";

// prisma data
import { cancelOrderByOid, getUnpaidOrder } from "@/data/order/reserveation";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function GET(req: Request) {
  // guard
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // deadline — orders older than 10 minutes
    const deadline = new Date(Date.now() - 15 * 60000);

    // find all orders still processing past the deadline
    const staleOrders = await getUnpaidOrder(deadline);

    // cancel each stale order
    const results = await Promise.allSettled(
      staleOrders.map((order) => cancelOrderByOid(order.oid)),
    );

    // return
    return NextResponse.json({
      cancelled: staleOrders.length,
      results,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
