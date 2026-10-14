import "server-only";

// prisma data
import {
  claimDaftraDocument,
  finishDaftraDocument,
  getDaftraRefund,
  getOrderInvoiceDocument,
  sumOtherActiveRefunds,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { daftraRequest } from "@/lib/daftra/client";
import {
  BEFORE_START_MESSAGE,
  beforeDaftraStart,
  claimOutcome,
  sendOrderInvoice,
} from "@/lib/daftra/invoice";
import {
  riyadhDay,
  round2,
  splitRefund,
  sumLines,
  vatInside,
  type DaftraPaymentLine,
  type DaftraSendResult,
  type DaftraSource,
} from "@/lib/daftra/format";

// prisma types
import { DaftraDocType, DaftraSyncState } from "@/lib/generated/prisma/enums";

const sar = (n: number) => `${round2(n).toFixed(2)} ر.س`;

// what the source invoice row's payload holds (the exact body sent)
type SentInvoiceBody = {
  InvoiceItem?: { product_id: number; item: string }[];
  Payment?: DaftraPaymentLine[];
};

// the refund's payment lines: the source invoice's lines split in proportion, with
// refund.reference as the transaction id
export function refundLines(
  source: DaftraPaymentLine[],
  amount: number,
  reference: string | null,
  date: string,
): DaftraPaymentLine[] {
  return splitRefund(source, amount).map((l) => ({
    payment_method: l.payment_method,
    amount: l.amount,
    transaction_id: reference ?? "",
    date,
  }));
}

// the POST /refund_receipts.json body: one line (the source invoice's product and item) at the
// VAT-inclusive refund amount; the client and currency come from the source invoice. client_email
// follows the invoice rule (the author's real email, else DAFTRA_CLIENT_EMAIL)
export function buildRefundBody(input: {
  oid: number;
  clientEmail: string;
  rfid: number;
  amount: number;
  reason?: string | null;
  reference: string | null;
  date: string;
  source: {
    daftraId: number;
    daftraNo: string | null;
    item: { product_id: number; item: string };
  };
  lines: DaftraPaymentLine[];
}) {
  const notes = [
    ["رقم الطلب", `#${input.oid}`],
    ["رقم الاسترداد", input.rfid],
    ["المبلغ المسترد", sar(input.amount)],
    ["الضريبة", sar(vatInside(input.amount))],
    ["سبب الاسترداد", input.reason?.trim()],
    ["مرجع العملية", input.reference],
    ["رقم الفاتورة الأصلية", input.source.daftraNo],
  ]
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");

  return {
    Invoice: {
      subscription_id: input.source.daftraId,
      client_email: input.clientEmail,
      date: input.date,
      notes,
    },
    InvoiceItem: [
      {
        product_id: input.source.item.product_id,
        item: input.source.item.item,
        description: `استرداد — طلب #${input.oid}`,
        unit_price: input.amount,
        quantity: 1,
      },
    ],
    Payment: input.lines,
  };
}

// the daftra refund receipt of one Refund row (exactly one per row: "refund:{refund.id}").
// Refund.amount is the money returned, VAT included (the gateways report the refunded charge).
// the money goes back through the original payment lines of the source invoice, split in the
// same proportion, whatever Refund.channel says
export async function sendRefundReceipt(
  refundId: string,
  options: { source: DaftraSource; force?: boolean },
): Promise<DaftraSendResult> {
  const config = getDaftraConfig();
  if (!config.enabled)
    return { state: false, status: "disabled", message: "الربط مع دفترة غير مفعّل" };
  if (!config.ok) {
    console.error(`[daftra] config incomplete: ${config.missing.join(", ")}`);
    return { state: false, status: "failed", message: "إعدادات دفترة غير مكتملة" };
  }

  const refund = await getDaftraRefund(refundId);
  const amount = refund ? round2(refund.amount) : 0;
  if (!refund || amount <= 0)
    return { state: false, status: "not_eligible", message: "الاسترداد غير موجود" };

  const oid = refund.orderId;

  // the go-live guard, by the order's created_at (the dashboard's force skips it)
  if (!options.force && beforeDaftraStart(refund.order.created_at, config))
    return { state: false, status: "not_eligible", message: BEFORE_START_MESSAGE };

  // the source invoice must be in daftra first: send it now if it was never sent or failed
  let invoice = await getOrderInvoiceDocument(oid);
  if (!invoice || invoice.state === DaftraSyncState.FAILED) {
    const sent = await sendOrderInvoice(oid, {
      source: options.source,
      allowRefunded: true,
      // the nightly retry never sends the invoice pdf on whatsapp
      whatsapp: options.source === "cron" ? false : undefined,
      // a forced refund of a pre-start order needs its invoice past the same guard
      force: options.force && beforeDaftraStart(refund.order.created_at, config) ? true : undefined,
    });
    if (sent.status !== "sent" && sent.status !== "already_sent")
      return {
        state: false,
        status:
          sent.status === "disabled" || sent.status === "not_eligible"
            ? sent.status
            : "invoice_not_ready",
        message: "فاتورة الطلب غير موجودة في دفترة",
      };
    invoice = await getOrderInvoiceDocument(oid);
  }
  if (!invoice || invoice.state !== DaftraSyncState.SENT || !invoice.daftraId)
    return {
      state: false,
      status: "invoice_not_ready",
      message: "فاتورة الطلب غير موجودة في دفترة",
    };

  // the refund goes back through the invoice's own payment lines, in proportion
  const sentBody = (invoice.payload ?? {}) as SentInvoiceBody;
  const sourceLines = sentBody.Payment ?? [];
  const sourceItem = sentBody.InvoiceItem?.[0];
  const date = riyadhDay(refund.refundedAt);
  const lines = refundLines(sourceLines, amount, refund.reference, date);
  const tax = vatInside(amount);

  const claim = await claimDaftraDocument({
    dedupeKey: `refund:${refund.id}`,
    type: DaftraDocType.REFUND,
    orderId: oid,
    refundId: refund.id,
    amount,
    tax,
    method: lines.map((l) => l.payment_method).join(","),
    source: options.source,
    force: options.force,
  });
  if (!claim.claimed) return claimOutcome(claim);

  try {
    const fail = async (error: string) => {
      await finishDaftraDocument(claim.id, {
        state: DaftraSyncState.FAILED,
        error,
        daftraParent: invoice.daftraId,
      });
      return {
        state: false,
        status: "failed",
        message: "تعذر إنشاء إشعار الاسترداد",
      } satisfies DaftraSendResult;
    };

    // the guard: every refund receipt of the order together can't exceed the invoice
    const others = await sumOtherActiveRefunds(oid, refund.id);
    if (round2(others + amount) > round2(invoice.amount) + 0.009)
      return fail(
        `refunds (${round2(others)} + ${amount}) exceed the invoice amount (${invoice.amount})`,
      );
    if (!sourceItem) return fail("the source invoice has no line to refund");
    if (!lines.length || sumLines(lines) !== amount)
      return fail(`the refund lines (${sumLines(lines)}) don't add up to ${amount}`);

    const body = buildRefundBody({
      oid,
      clientEmail: refund.authorEmail ?? config.clientEmail,
      rfid: refund.rfid,
      amount,
      reason: refund.request?.reason,
      reference: refund.reference,
      date,
      source: {
        daftraId: invoice.daftraId,
        daftraNo: invoice.daftraNo,
        item: sourceItem,
      },
      lines,
    });

    const result = await daftraRequest(config, "/refund_receipts.json", body);

    if (result.kind === "success") {
      await finishDaftraDocument(claim.id, {
        state: DaftraSyncState.SENT,
        daftraId: result.id,
        daftraNo: result.number,
        daftraClientId: invoice.daftraClientId,
        daftraParent: invoice.daftraId,
        payload: body,
        response: result.body,
      });
      return {
        state: true,
        status: "sent",
        daftraId: result.id,
        daftraNo: result.number ?? undefined,
        message: "تم الإرسال إلى دفترة",
      };
    }

    await finishDaftraDocument(claim.id, {
      state: result.kind === "failed" ? DaftraSyncState.FAILED : DaftraSyncState.REVIEW,
      error: result.error,
      daftraClientId: invoice.daftraClientId,
      daftraParent: invoice.daftraId,
      payload: body,
      response: result.body,
    });
    return result.kind === "failed"
      ? { state: false, status: "failed", message: "رفضت دفترة إشعار الاسترداد" }
      : { state: false, status: "review", message: "النتيجة غير معروفة، تحتاج إلى مراجعة" };
  } catch (err) {
    // an unexpected error after the claim: REVIEW, never FAILED (daftra may have the receipt)
    console.error(
      `[daftra] refund rfid=${refund.rfid} error`,
      err instanceof Error ? err.name : "error",
    );
    await finishDaftraDocument(claim.id, {
      state: DaftraSyncState.REVIEW,
      error: "unexpected error after the claim",
    }).catch(() => {});
    return { state: false, status: "review", message: "النتيجة غير معروفة، تحتاج إلى مراجعة" };
  }
}
