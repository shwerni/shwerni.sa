// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// lib
import { sendRefundReceipt } from "@/lib/daftra/refund";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  refundId: z.string().min(1).max(64),
  force: z.boolean().optional(),
});

// the dashboard (re)sends a refund's daftra refund receipt (the dashboard creates its own Refund
// rows, so it calls this after each one). the handler checks the source invoice, the refund total
// guard and the duplicate guard itself; force only re-sends a REVIEW row
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    const result = await sendRefundReceipt(parsed.data.refundId, {
      source: "dashboard",
      force: parsed.data.force,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "[daftra] dashboard refund error",
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", message: "unexpected error" },
      { status: 500 },
    );
  }
}
