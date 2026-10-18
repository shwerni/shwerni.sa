// React & Next
import { NextResponse, after } from "next/server";

// packages
import { z } from "zod";

// prisma data
import { getOrderInvoiceDocument } from "@/data/daftra";

// lib
import { sendOrderInvoice } from "@/lib/daftra/invoice";
import { deliverInvoicePdf } from "@/lib/daftra/invoice-pdf";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// prisma types
import { DaftraSyncState } from "@/lib/generated/prisma/enums";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

const bodySchema = z.object({
  oid: z.number().int().positive(),
  // skips the go-live date. it never re-sends a REVIEW invoice: that answers use_resolve
  force: z.boolean().optional(),
  // send the invoice pdf on whatsapp again (only when the invoice is already SENT)
  resendWhatsapp: z.boolean().optional(),
  // false: create the invoice without its pdf on whatsapp (whatsappSentAt stays null, so
  // resendWhatsapp can send it later). default true
  whatsapp: z.boolean().optional(),
});

// the dashboard (re)sends an order's daftra invoice. the handler checks eligibility and the
// duplicate guard itself; force only skips the go-live date, and a forced call on a REVIEW
// invoice is refused with use_resolve (settle it with /resolve). generic messages here, the details
// stay in the logs and on the DaftraInvoice row. a fresh send already delivers the pdf on
// whatsapp; resendWhatsapp re-sends it for an invoice that was already SENT (after the response)
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  try {
    // a REVIEW invoice may already be in daftra: never re-sent, the dashboard settles it first
    if (parsed.data.force) {
      const row = await getOrderInvoiceDocument(parsed.data.oid);
      if (row?.state === DaftraSyncState.REVIEW)
        return NextResponse.json({
          state: false,
          status: "use_resolve",
          message: "الفاتورة بانتظار المراجعة: سوّها أولاً من خطوة المراجعة",
        });
    }

    const result = await sendOrderInvoice(parsed.data.oid, {
      source: "dashboard",
      force: parsed.data.force,
      whatsapp: parsed.data.whatsapp,
    });
    if (parsed.data.resendWhatsapp && result.status === "already_sent")
      after(() => deliverInvoicePdf(parsed.data.oid, { resend: true }));

    return NextResponse.json(result);
  } catch (err) {
    console.error(
      `[daftra] dashboard invoice oid=${parsed.data.oid} error`,
      err instanceof Error ? err.name : "error",
    );
    return NextResponse.json(
      { state: false, status: "failed", message: "حدث خطأ غير متوقع" },
      { status: 500 },
    );
  }
}
