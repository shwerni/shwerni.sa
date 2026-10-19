// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// prisma data
import { getDaftraDocument } from "@/data/daftra";

// lib
import { sendRefundReceipt } from "@/lib/daftra/refund";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// prisma types
import { DaftraSyncState } from "@/lib/generated/prisma/enums";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  refundId: z.string().min(1).max(64),
  // skips the go-live date. it never re-sends a REVIEW receipt: that answers use_resolve
  force: z.boolean().optional(),
  // a refund on an order marked "never send to daftra" with no invoice in daftra answers skipped
  // (the dashboard calls this after every refund row); once its invoice is in daftra the receipt
  // goes as usual. override sends it anyway, the order's invoice first if needed
  override: z.boolean().optional(),
});

// the dashboard (re)sends a refund's daftra refund receipt (the dashboard creates its own Refund
// rows, so it calls this after each one). the handler checks the source invoice, the refund total
// guard and the duplicate guard itself; force only skips the go-live date, and a forced call on a
// REVIEW receipt is refused with use_resolve (settle it with /resolve)
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    // a REVIEW receipt may already be in daftra: never re-sent, the dashboard settles it first
    if (parsed.data.force) {
      const row = await getDaftraDocument(`refund:${parsed.data.refundId}`);
      if (row?.state === DaftraSyncState.REVIEW)
        return NextResponse.json({
          state: false,
          status: "use_resolve",
          message: "إشعار الاسترداد بانتظار المراجعة: سوّه أولاً من خطوة المراجعة",
        });
    }

    const result = await sendRefundReceipt(parsed.data.refundId, {
      source: "dashboard",
      force: parsed.data.force,
      override: parsed.data.override,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      "[daftra] dashboard refund error",
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", message: "حدث خطأ غير متوقع" },
      { status: 500 },
    );
  }
}
