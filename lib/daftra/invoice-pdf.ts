import "server-only";

// prisma data
import {
  claimInvoiceWhatsapp,
  getInvoiceDelivery,
  releaseInvoiceWhatsapp,
  saveInvoiceLinks,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { daftraGet } from "@/lib/daftra/client";
import { fetchInvoicePdf } from "@/lib/daftra/pdf";
import { sendWhatsappTemplate, uploadWhatsappMedia } from "@/lib/api/whatsapp";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// prisma types
import { DaftraSyncState } from "@/lib/generated/prisma/enums";

// utils
import { phoneNumber } from "@/utils";

// daftra's links in GET /invoices/{id}.json (under data.Invoice, or Invoice)
const linksOf = (body: unknown) => {
  const b = body as {
    data?: { Invoice?: Record<string, unknown> };
    Invoice?: Record<string, unknown>;
  } | null;
  const invoice = b?.data?.Invoice ?? b?.Invoice;
  const link = (value: unknown) =>
    typeof value === "string" && value.startsWith("http") ? value : null;
  return {
    pdfUrl: link(invoice?.invoice_pdf_url),
    htmlUrl: link(invoice?.invoice_html_url),
  };
};

// what one delivery did. callers on the payment path ignore it; the dashboard's resend route
// returns it. no_invoice carries the row's state (null: no invoice row at all)
export type InvoicePdfDelivery =
  | { ok: true }
  | { ok: false; reason: "disabled" | "config_error" }
  | { ok: false; reason: "no_invoice"; invoiceState: DaftraSyncState | null }
  | { ok: false; reason: "already_delivered" | "in_progress" }
  | { ok: false; reason: "pdf_failed" | "whatsapp_failed" | "error" };

// the invoice pdf to the client on whatsapp (template "order_invoice": a document header with
// the pdf, body {{1}} = oid), after the INVOICE is SENT. the pdf is fetched on our server through
// the hash preview link (lib/daftra/pdf.ts), verified, uploaded to whatsapp and sent by media id:
// never a daftra link. a pdf that fails the check is never sent (whatsappSentAt stays empty) and
// alerts the admin. never twice: the send is claimed first (whatsappSentAt set only where it's
// null), a failed send gives the claim back and alerts the admin. resend (the dashboard) sends
// again whatever whatsappSentAt says. never throws, and never creates or sends an invoice: no
// SENT invoice → no_invoice. invoices only, never refund receipts
export async function deliverInvoicePdf(
  oid: number,
  options: { resend?: boolean } = {},
): Promise<InvoicePdfDelivery> {
  try {
    const config = getDaftraConfig();
    if (!config.enabled) return { ok: false, reason: "disabled" };
    if (!config.ok) return { ok: false, reason: "config_error" };

    const row = await getInvoiceDelivery(oid);
    if (!row || row.state !== DaftraSyncState.SENT || !row.daftraId)
      return { ok: false, reason: "no_invoice", invoiceState: row?.state ?? null };
    // already sent and not a resend: nothing to fetch (the claim below would refuse it anyway)
    if (row.whatsappSentAt && !options.resend) return { ok: false, reason: "already_delivered" };

    const fetchFailed = async (reason: string) => {
      console.error(`[daftra] invoice oid=${oid} pdf fetch failed (${reason})`);
      await telegramAdmin(`daftra: invoice oid=${oid} pdf fetch failed (${reason})`);
      return { ok: false, reason: "pdf_failed" } as const;
    };

    // the preview link, read once from daftra and kept on the row (with the pdf link)
    let htmlUrl = row.htmlUrl;
    if (!htmlUrl) {
      const links = linksOf(await daftraGet(config, `/invoices/${row.daftraId}.json`));
      if (!links.htmlUrl) return fetchFailed("no preview link");
      await saveInvoiceLinks(row.id, { pdfUrl: links.pdfUrl, htmlUrl: links.htmlUrl });
      htmlUrl = links.htmlUrl;
    }

    // the real pdf, checked before anything is claimed or sent
    const pdf = await fetchInvoicePdf(htmlUrl, row.daftraId);
    if (!pdf.ok) return fetchFailed(pdf.reason);

    if (!(await claimInvoiceWhatsapp(row.id, !!options.resend)))
      return { ok: false, reason: "in_progress" };

    const filename = `فاتورة-${row.daftraNo ?? row.daftraId}.pdf`;
    const media = await uploadWhatsappMedia(pdf.buffer, "application/pdf", filename).catch(
      () => null,
    );

    const sent = media?.ok
      ? await sendWhatsappTemplate(phoneNumber(row.order.phone), "order_invoice", {
          header: { type: "document", id: media.id, filename },
          text: [oid],
        }).catch(() => null)
      : null;

    if (sent?.ok) return { ok: true };

    await releaseInvoiceWhatsapp(row.id, options.resend ? row.whatsappSentAt : null);
    const failure = media && !media.ok ? media : sent && !sent.ok ? sent : null;
    const step = media?.ok ? "whatsapp pdf" : "whatsapp media upload";
    const code = failure ? (failure.errorCode ?? failure.httpStatus ?? "-") : "throw";
    console.error(`[daftra] invoice oid=${oid} ${step} failed code=${code}`);
    await telegramAdmin(`daftra: invoice oid=${oid} ${step} failed | code ${code}`);
    return { ok: false, reason: "whatsapp_failed" };
  } catch (err) {
    console.error(
      `[daftra] invoice oid=${oid} whatsapp error`,
      err instanceof Error ? err.name : "error",
    );
    return { ok: false, reason: "error" };
  }
}
