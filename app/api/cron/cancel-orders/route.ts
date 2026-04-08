// React & Next
import { NextResponse } from "next/server";

// prisma data
import { cancelOrders } from "@/data/order/reserveation";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function GET(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    // deadline — orders older than 20 minutes
    const deadline = new Date(Date.now() - 20 * 60000);

    // find all orders still processing past the deadline
    const cancelled = await cancelOrders(deadline);

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
