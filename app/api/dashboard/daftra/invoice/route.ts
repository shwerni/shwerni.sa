// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// lib
import { sendOrderInvoice } from "@/lib/daftra/invoice";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  oid: z.number().int().positive(),
  force: z.boolean().optional(),
});

// the dashboard (re)sends an order's daftra invoice. the handler checks eligibility and the
// duplicate guard itself; force only re-sends a REVIEW row. generic messages here, the details
// stay in the logs and on the DaftraInvoice row
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    const result = await sendOrderInvoice(parsed.data.oid, {
      source: "dashboard",
      force: parsed.data.force,
    });
    return NextResponse.json(result);
  } catch (err) {
    console.error(
      `[daftra] dashboard invoice oid=${parsed.data.oid} error`,
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", message: "unexpected error" },
      { status: 500 },
    );
  }
}
