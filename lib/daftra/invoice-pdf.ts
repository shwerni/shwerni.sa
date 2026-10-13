import "server-only";

// prisma data
import {
  claimInvoiceWhatsapp,
  getInvoiceDelivery,
  releaseInvoiceWhatsapp,
  saveInvoicePdfUrl,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { daftraGet } from "@/lib/daftra/client";
import { sendWhatsappTemplate } from "@/lib/api/whatsapp";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// prisma types
import { DaftraSyncState } from "@/lib/generated/prisma/enums";

// utils
import { phoneNumber } from "@/utils";

// daftra's pdf link in GET /invoices/{id}.json (under data.Invoice, or Invoice)
const pdfUrlOf = (body: unknown): string | null => {
  const b = body as {
    data?: { Invoice?: { invoice_pdf_url?: unknown } };
    Invoice?: { invoice_pdf_url?: unknown };
  } | null;
  const url = b?.data?.Invoice?.invoice_pdf_url ?? b?.Invoice?.invoice_pdf_url;
  return typeof url === "string" && url.startsWith("http") ? url : null;
};

// the invoice pdf to the client on whatsapp (template "order_invoice": a document header with
// the pdf, body {{1}} = oid), after the INVOICE is SENT. never twice: the send is claimed first
// (whatsappSentAt set only where it's null), a failed send gives the claim back and alerts the
// admin. resend (the dashboard) sends again whatever whatsappSentAt says. never throws. invoices
// only, never refund receipts
export async function deliverInvoicePdf(
  oid: number,
  options: { resend?: boolean } = {},
): Promise<boolean> {
  try {
    const config = getDaftraConfig();
    if (!config.enabled || !config.ok) return false;

    const row = await getInvoiceDelivery(oid);
    if (!row || row.state !== DaftraSyncState.SENT || !row.daftraId) return false;

    // the pdf link, read once from daftra and kept on the row
    let pdfUrl = row.pdfUrl;
    if (!pdfUrl) {
      pdfUrl = pdfUrlOf(await daftraGet(config, `/invoices/${row.daftraId}.json`));
      if (!pdfUrl) {
        await telegramAdmin(`daftra: invoice oid=${oid} pdf link not found, whatsapp not sent`);
        return false;
      }
      await saveInvoicePdfUrl(row.id, pdfUrl);
    }

    if (!(await claimInvoiceWhatsapp(row.id, !!options.resend))) return false;

    const sent = await sendWhatsappTemplate(phoneNumber(row.order.phone), "order_invoice", {
      header: {
        type: "document",
        value: pdfUrl,
        filename: `فاتورة-${row.daftraNo ?? row.daftraId}.pdf`,
      },
      text: [oid],
    }).catch(() => null);

    if (sent?.ok) return true;

    await releaseInvoiceWhatsapp(row.id, options.resend ? row.whatsappSentAt : null);
    const code = sent && !sent.ok ? (sent.errorCode ?? sent.httpStatus ?? "-") : "throw";
    console.error(`[daftra] invoice oid=${oid} whatsapp failed code=${code}`);
    await telegramAdmin(`daftra: invoice oid=${oid} whatsapp pdf failed | code ${code}`);
    return false;
  } catch (err) {
    console.error(
      `[daftra] invoice oid=${oid} whatsapp error`,
      err instanceof Error ? err.name : "error",
    );
    return false;
  }
}
