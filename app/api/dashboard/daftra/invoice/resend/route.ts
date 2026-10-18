// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";

// lib
import { deliverInvoicePdf } from "@/lib/daftra/invoice-pdf";
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// node.js runtime: the default for route handlers (a "runtime" export isn't allowed with cacheComponents)

// the daftra GET (first time only), the pdf fetch and the whatsapp upload run inside the request
export const maxDuration = 60;

const bodySchema = z.object({
  oid: z.number().int().positive().max(2_147_483_647),
  // the dashboard's session user, for the log (the dashboard keeps its own finance log)
  actor: z.object({
    id: z.string().trim().min(1).max(100),
    name: z.string().trim().min(1).max(200),
    role: z.nativeEnum(UserRole),
  }),
});

// the dashboard resends an order's invoice pdf to the client on whatsapp and learns whether it
// really went out. it never creates or sends an invoice: an order with no SENT invoice gets
// no_invoice (invoiceState: "missing" when there's no row at all, else the row's state)
export async function POST(request: Request) {
  if (!verifyDashboardSecret(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ error: "invalid body" }, { status: 400 });

  const { oid, actor } = parsed.data;
  const result = await deliverInvoicePdf(oid, { resend: true });
  console.info(
    `[daftra] dashboard pdf resend oid=${oid} by=${actor.id} → ${result.ok ? "sent" : result.reason}`,
  );

  if (result.ok)
    return NextResponse.json({ state: true, status: "sent", message: "تم إرسال الفاتورة إلى العميل" });

  switch (result.reason) {
    case "no_invoice":
      return NextResponse.json({
        state: false,
        status: "no_invoice",
        invoiceState: result.invoiceState ?? "missing",
        message: "لا توجد فاتورة في دفترة لهذا الطلب",
      });
    case "disabled":
      return NextResponse.json({ state: false, status: "disabled", message: "الربط مع دفترة غير مفعّل" });
    case "pdf_failed":
      return NextResponse.json({ state: false, status: "pdf_failed", message: "تعذر تجهيز ملف الفاتورة" });
    case "whatsapp_failed":
      return NextResponse.json({ state: false, status: "whatsapp_failed", message: "تعذر الإرسال عبر واتساب" });
    default:
      // config_error, an unexpected error, or a claim that vanished (a resend always claims)
      return NextResponse.json({ state: false, status: "failed", message: "حدث خطأ غير متوقع" });
  }
}
