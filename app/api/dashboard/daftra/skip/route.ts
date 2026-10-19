// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// prisma data
import { setOrderDaftraSkip } from "@/data/daftra";

// lib
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  oid: z.number().int().positive().max(2_147_483_647),
  // true: never send this order to daftra; false: clear the flag
  skip: z.boolean(),
  // the dashboard's session user, kept on the order as who changed it last
  actor: z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(200),
  }),
});

// the dashboard sets or clears an order's "never send to daftra" flag (Order.daftraSkip, with who
// and when). it sends nothing either way: clearing it only lets the next automatic path or a
// dashboard call send again. invoiceState tells the dashboard whether the order already has an
// invoice row ("missing" when it has none)
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { oid, skip, actor } = parsed.data;
  try {
    const order = await setOrderDaftraSkip(oid, skip, actor);
    if (!order)
      return NextResponse.json({
        state: false,
        status: "not_found",
        oid,
        message: "الطلب غير موجود",
      });

    console.info(`[daftra] dashboard skip oid=${oid} skip=${skip} by=${actor.id}`);
    return NextResponse.json({
      state: true,
      status: "updated",
      oid,
      daftraSkip: order.daftraSkip,
      daftraSkipById: order.daftraSkipById,
      daftraSkipByName: order.daftraSkipByName,
      daftraSkipAt: order.daftraSkipAt,
      invoiceState: order.invoiceState,
      message: skip ? "لن يُرسل هذا الطلب إلى دفترة" : "أُلغي استثناء الطلب من دفترة",
    });
  } catch (err) {
    console.error(
      `[daftra] dashboard skip oid=${oid} error`,
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", oid, message: "حدث خطأ غير متوقع" },
      { status: 500 },
    );
  }
}
