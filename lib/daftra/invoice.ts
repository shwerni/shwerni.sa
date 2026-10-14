import "server-only";

// prisma data
import {
  claimDaftraDocument,
  finishDaftraDocument,
  getDaftraInvoiceOrder,
  type ClaimResult,
  type DaftraInvoiceOrder,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { daftraRequest } from "@/lib/daftra/client";
import { deliverInvoicePdf } from "@/lib/daftra/invoice-pdf";
import { getOrCreateDaftraClient } from "@/lib/daftra/customer";
import {
  daftraMethodCode,
  internationalPhone,
  phoneKey,
  riyadhDay,
  round2,
  sumLines,
  vatInside,
  type DaftraPaymentLine,
  type DaftraSendResult,
  type DaftraSource,
} from "@/lib/daftra/format";

// prisma types
import {
  DaftraDocType,
  DaftraSyncState,
  OrderOrigin,
  OrderType,
  PaymentMethod,
  PaymentState,
} from "@/lib/generated/prisma/enums";

// utils
import { findCategory } from "@/utils";
import { withTax } from "@/utils/tax";

type Config = Extract<ReturnType<typeof getDaftraConfig>, { ok: true }>;

const sar = (n: number) => `${round2(n).toFixed(2)} ر.س`;

const methodLabel = (method: PaymentMethod) => {
  switch (method) {
    case PaymentMethod.visaMoyasar:
      return "بطاقة (ميسر)";
    case PaymentMethod.tabby:
      return "تابي";
    case PaymentMethod.transaction:
      return "تحويل بنكي";
    case PaymentMethod.wallet:
      return "المحفظة";
  }
};

// a claim that didn't go to this caller, as a handler result
export const claimOutcome = (
  claim: Extract<ClaimResult, { claimed: false }>,
): DaftraSendResult => {
  if (claim.status === "already_sent")
    return {
      state: true,
      status: "already_sent",
      daftraId: claim.row?.daftraId ?? undefined,
      daftraNo: claim.row?.daftraNo ?? undefined,
      message: "أُرسل إلى دفترة مسبقًا",
    };
  if (claim.status === "review")
    return { state: false, status: "review", message: "بانتظار المراجعة" };
  return { state: false, status: "already_claimed", message: "الإرسال جارٍ بالفعل" };
};

// ---------- the invoice body ----------

type BuiltInvoice =
  | {
      ok: true;
      amount: number; // VAT-inclusive, the one line's unit_price
      tax: number;
      productId: number;
      item: string;
      description: string;
      date: string;
      lines: DaftraPaymentLine[];
      notes: string;
    }
  | { ok: false; amount: number; tax: number; method: string; error: string };

// the order as one daftra line (packages and multi-session orders too) at withTax(payment.total),
// the same amount the moyasar and tabby webhooks verify, with one payment line per source of money
export function buildOrderInvoice(
  order: DaftraInvoiceOrder,
  config: Config,
): BuiltInvoice {
  const payment = order.payment!;
  const amount = round2(withTax(payment.total));
  const tax = vatInside(amount);
  const fail = (error: string, method = "") =>
    ({ ok: false, amount, tax, method, error }) as const;

  // the product, by the first meeting's duration
  const first = order.meeting[0];
  if (!first) return fail("the order has no meeting");
  const duration = Number(first.duration) as 30 | 45 | 60;
  const productId = config.products[duration];
  if (!productId) return fail(`no daftra product for a ${first.duration} minute session`);

  if (!payment.method) return fail("the order has no payment method");

  // the money: wallet credit (Payment.wallet, sar incl. VAT) and the rest through the order's method
  const date = riyadhDay(order.created_at);
  const wallet =
    payment.method === PaymentMethod.wallet ? amount : round2(payment.wallet ?? 0);
  if (wallet < 0 || wallet > amount + 0.009)
    return fail(`the wallet part (${wallet}) is more than the total (${amount})`);

  const lines: DaftraPaymentLine[] = [];
  const rest = round2(amount - wallet);
  if (rest > 0)
    lines.push({
      payment_method: daftraMethodCode(payment.method, config.walletMethod),
      amount: rest,
      transaction_id: payment.pid ?? "",
      date,
    });
  if (wallet > 0)
    lines.push({
      payment_method: config.walletMethod,
      amount: wallet,
      transaction_id: payment.method === PaymentMethod.wallet ? (payment.pid ?? "") : "",
      date,
    });

  const method = lines.map((l) => l.payment_method).join(",");
  if (sumLines(lines) !== amount)
    return fail(`the payment lines (${sumLines(lines)}) don't add up to the total (${amount})`, method);

  return {
    ok: true,
    amount,
    tax,
    productId,
    item: `جلسة ${duration} دقيقة`,
    description: `استشارة مع ${order.consultant.name} — ${order.sessionCount} جلسة — طلب #${order.oid}`,
    date,
    lines,
    notes: invoiceNotes(order, { amount, tax, wallet }),
  };
}

// the invoice notes, arabic, one fact per line, empty facts skipped. coupons are written here
// only, never as a daftra discount
function invoiceNotes(
  order: DaftraInvoiceOrder,
  money: { amount: number; tax: number; wallet: number },
) {
  const payment = order.payment!;

  const kinds = [
    order.type === OrderType.INSTANT ? "فوري" : "مجدول",
    order.pleading && "مرافعة",
    order.reconciliation && "جلسة صلح",
    order.gift && "هدية",
    order.program && `برنامج: ${order.program.title}`,
    order.package && `باقة ${order.package.count} جلسات`,
    order.scaleId && "مقياس",
  ].filter(Boolean);

  const durations = [...new Set(order.meeting.map((m) => m.duration))];
  const coupon = payment.usedCoupon;

  const lines: [string, string | number | null | undefined][] = [
    ["رقم الطلب", `#${order.oid}`],
    ["تاريخ الطلب", riyadhDay(order.created_at)],
    ["اسم العميل", order.name],
    ["جوال العميل", internationalPhone(phoneKey(order.phone))],
    ["المستشار", order.consultant.name],
    ["التخصص/القسم", findCategory(order.consultant.category)?.label],
    ["المركز", order.center?.name],
    ["نوع الطلب", kinds.join("، ")],
    ["عدد الجلسات", order.sessionCount],
    [
      "مدة الجلسة",
      durations.length > 1
        ? `${durations.join(" / ")} دقيقة (مدد مختلفة)`
        : `${durations[0]} دقيقة`,
    ],
    ["مواعيد الجلسات", order.meeting.map((m) => `${m.date} ${m.time}`).join(" | ")],
    [
      "طريقة الدفع",
      payment.method &&
        (money.wallet > 0 && payment.method !== PaymentMethod.wallet
          ? `${methodLabel(payment.method)} + المحفظة`
          : methodLabel(payment.method)),
    ],
    ["مرجع البوابة", payment.pid],
    ["الكوبون والخصم", coupon && `${coupon.code} (${coupon.discount}%)`],
    ["المبلغ قبل الضريبة", sar(payment.total)],
    ["الضريبة", sar(money.tax)],
    ["الإجمالي", sar(money.amount)],
    ["مدفوع من المحفظة", money.wallet > 0 ? sar(money.wallet) : null],
    ["المصدر", order.origin === OrderOrigin.APP ? "تطبيق" : "منصة"],
  ];

  return lines
    .filter(([, value]) => value !== null && value !== undefined && value !== "")
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

// the POST /invoices.json body: one line at the VAT-inclusive total, never a daftra discount
// (coupons are in the notes). client_email is always sent (the author's real email, else
// DAFTRA_CLIENT_EMAIL): daftra refuses the document for a client set to email invoicing without one
export function buildInvoiceBody(
  built: Extract<BuiltInvoice, { ok: true }>,
  clientId: number,
  oid: number,
  clientEmail: string,
) {
  return {
    Invoice: {
      client_id: clientId,
      client_email: clientEmail,
      date: built.date,
      draft: 0,
      currency_code: "SAR",
      discount: 0,
      discount_amount: 0,
      po_number: String(oid),
      notes: built.notes,
    },
    InvoiceItem: [
      {
        product_id: built.productId,
        item: built.item,
        description: built.description,
        unit_price: built.amount,
        quantity: 1,
      },
    ],
    Payment: built.lines,
  };
}

// ---------- sending ----------

// the go-live guard: an order created (riyadh day) before DAFTRA_START_DATE is never sent unless
// the dashboard forces it. nothing is claimed, so no DaftraInvoice row and no alert
export const BEFORE_START_MESSAGE = "الطلب قبل تاريخ بدء الربط مع دفترة";

export const beforeDaftraStart = (createdAt: Date, config: Config) =>
  riyadhDay(createdAt) < config.startDate;

// the daftra invoice of a paid order: exactly one per order (the DaftraInvoice row "invoice:{oid}"
// is the only duplicate guard). eligibility is checked here, never trusted from the caller.
// allowRefunded is for the refund receipt only: an order refunded before it was invoiced.
// whatsapp: false skips the pdf on whatsapp (a mark-as-paid without notifications)
export async function sendOrderInvoice(
  oid: number,
  options: {
    source: DaftraSource;
    force?: boolean;
    allowRefunded?: boolean;
    whatsapp?: boolean;
  },
): Promise<DaftraSendResult> {
  const config = getDaftraConfig();
  if (!config.enabled)
    return { state: false, status: "disabled", message: "الربط مع دفترة غير مفعّل" };
  if (!config.ok) {
    console.error(`[daftra] config incomplete: ${config.missing.join(", ")}`);
    return { state: false, status: "failed", message: "إعدادات دفترة غير مكتملة" };
  }

  const order = await getDaftraInvoiceOrder(oid);
  const state = order?.payment?.payment;
  const eligible =
    state === PaymentState.PAID ||
    (options.allowRefunded && state === PaymentState.REFUND);
  if (!order || !order.payment || !eligible)
    return { state: false, status: "not_eligible", message: "الطلب غير مدفوع" };

  if (!options.force && beforeDaftraStart(order.created_at, config))
    return { state: false, status: "not_eligible", message: BEFORE_START_MESSAGE };

  const built = buildOrderInvoice(order, config);

  const claim = await claimDaftraDocument({
    dedupeKey: `invoice:${oid}`,
    type: DaftraDocType.INVOICE,
    orderId: oid,
    amount: built.amount,
    tax: built.tax,
    method: built.ok ? built.lines.map((l) => l.payment_method).join(",") : built.method,
    source: options.source,
    force: options.force,
  });
  if (!claim.claimed) return claimOutcome(claim);

  try {
    if (!built.ok) {
      await finishDaftraDocument(claim.id, { state: DaftraSyncState.FAILED, error: built.error });
      return { state: false, status: "failed", message: "تعذر إنشاء الفاتورة" };
    }

    const customer = await getOrCreateDaftraClient(config, order);
    if (!customer.ok) {
      await finishDaftraDocument(claim.id, {
        state: DaftraSyncState.FAILED,
        error: customer.error,
      });
      return customer.status === "client_not_ready"
        ? { state: false, status: "client_not_ready", message: "العميل في دفترة غير جاهز بعد" }
        : { state: false, status: "failed", message: "تعذر إنشاء العميل في دفترة" };
    }

    const body = buildInvoiceBody(
      built,
      customer.daftraClientId,
      oid,
      order.authorEmail ?? config.clientEmail,
    );

    const result = await daftraRequest(config, "/invoices.json", body);

    if (result.kind === "success") {
      await finishDaftraDocument(claim.id, {
        state: DaftraSyncState.SENT,
        daftraId: result.id,
        daftraNo: result.number,
        daftraClientId: customer.daftraClientId,
        payload: body,
        response: result.body,
      });
      // the pdf to the client on whatsapp (never throws; on the payment path this already runs
      // after the response, after the order confirmation template)
      if (options.whatsapp !== false) await deliverInvoicePdf(oid);
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
      daftraClientId: customer.daftraClientId,
      payload: body,
      response: result.body,
    });
    return result.kind === "failed"
      ? { state: false, status: "failed", message: "رفضت دفترة الفاتورة" }
      : { state: false, status: "review", message: "النتيجة غير معروفة، تحتاج إلى مراجعة" };
  } catch (err) {
    // an unexpected error after the claim: REVIEW, never FAILED (daftra may have the invoice)
    console.error(`[daftra] invoice oid=${oid} error`, err instanceof Error ? err.name : "error");
    await finishDaftraDocument(claim.id, {
      state: DaftraSyncState.REVIEW,
      error: "unexpected error after the claim",
    }).catch(() => {});
    return { state: false, status: "review", message: "النتيجة غير معروفة، تحتاج إلى مراجعة" };
  }
}
