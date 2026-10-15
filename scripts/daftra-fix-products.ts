// one-off: DAFTRA_PRODUCT_ID_30 was set to the 45-minute product on production, so SENT invoices
// for 30-minute sessions were booked under the wrong daftra product. this corrects the product on
// those invoices, nothing else.
//
// usage: npx tsx scripts/daftra-fix-products.ts            dry run (default): reads only, prints
//                                                          what would change
//        npx tsx scripts/daftra-fix-products.ts --apply    PUTs the corrected invoices
//        add --only <oid> to read and fix one order's invoice (try one first, check it in daftra)
//
// - only DaftraInvoice rows of type INVOICE in state SENT; never refund receipts
// - the correct product is the builder's mapping (the first meeting's duration →
//   DAFTRA_PRODUCT_ID_30/45/60, read from the env this runs with)
// - only invoices with exactly one line whose product differs are changed. Edit Invoice replaces
//   the items and the payments, so the PUT sends the existing header, the same line with only
//   product_id changed (item, description, unit_price, quantity, and its tax and store kept) and
//   the existing payments back unchanged (method, amount, transaction_id, date, treasury, status)
// - after each PUT a GET verifies the total, the paid amount, the payments and the line; the run
//   stops on the first difference
// - after a verified PUT the row's stored payload gets the corrected product_id (refund receipts
//   take their line's product from it). nothing is created or deleted, no whatsapp is sent
// - 1 second between daftra calls

// prisma db
import { prismaAll as prisma } from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import { DaftraDocType, DaftraSyncState } from "@/lib/generated/prisma/enums";

const APPLY = process.argv.includes("--apply");
const onlyArg = process.argv.indexOf("--only");
const ONLY = onlyArg > -1 ? Number(process.argv[onlyArg + 1]) : null;
if (ONLY !== null && !(Number.isInteger(ONLY) && ONLY > 0)) {
  console.error("--only needs an order id (oid)");
  process.exit(1);
}
const GAP_MS = 1_000;
const TIMEOUT_MS = 20_000;

type Json = Record<string, unknown>;

const pause = () => new Promise((resolve) => setTimeout(resolve, GAP_MS));
const money = (v: unknown) => Math.round(Number(v) * 100) / 100;
const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

// the same product mapping the builder uses (lib/daftra/config.ts)
const productId = (value: string | undefined) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

function readEnv() {
  const subdomain = process.env.DAFTRA_SUBDOMAIN?.trim().toLowerCase();
  const apiKey = process.env.DAFTRA_API_KEY?.trim();
  const products = {
    30: productId(process.env.DAFTRA_PRODUCT_ID_30),
    45: productId(process.env.DAFTRA_PRODUCT_ID_45),
    60: productId(process.env.DAFTRA_PRODUCT_ID_60),
  };
  if (!subdomain || !apiKey || !products[30] || !products[45] || !products[60]) {
    console.error("missing or invalid DAFTRA_SUBDOMAIN, DAFTRA_API_KEY or DAFTRA_PRODUCT_ID_30/45/60");
    process.exit(1);
  }
  const ids = new Set([products[30], products[45], products[60]]);
  if (ids.size !== 3) {
    console.error(`the three product ids must differ: 30→${products[30]} 45→${products[45]} 60→${products[60]}`);
    process.exit(1);
  }
  return { subdomain, apiKey, products: products as Record<30 | 45 | 60, number> };
}

const env = readEnv();

async function daftra(method: "GET" | "PUT", path: string, body?: unknown) {
  const res = await fetch(`https://${env.subdomain}.daftra.com/api2${path}`, {
    method,
    headers: {
      apikey: env.apiKey,
      Accept: "application/json",
      ...(body !== undefined && { "Content-Type": "application/json" }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const json = (await res.json().catch(() => null)) as Json | null;
  return { status: res.status, json };
}

// GET /invoices/{id}.json → the Invoice with its InvoiceItem and InvoicePayment arrays
async function getInvoice(daftraId: number) {
  const { status, json } = await daftra("GET", `/invoices/${daftraId}.json`);
  const invoice = (json?.data as Json | undefined)?.Invoice as Json | undefined;
  if (status !== 200 || !invoice) return null;
  return {
    invoice,
    items: (invoice.InvoiceItem as Json[] | undefined) ?? [],
    payments: (invoice.InvoicePayment as Json[] | undefined) ?? [],
  };
}

type Live = NonNullable<Awaited<ReturnType<typeof getInvoice>>>;

// the edit body: the existing header, the one line with only product_id changed, the payments
// back unchanged
function editBody(live: Live, correct: number) {
  const { invoice, items, payments } = live;
  const line = items[0];
  const optional = (o: Json, key: string) =>
    o[key] === null || o[key] === undefined ? {} : { [key]: o[key] };

  return {
    Invoice: {
      no: invoice.no,
      client_id: Number(invoice.client_id),
      date: text(invoice.date).slice(0, 10),
      draft: Number(invoice.draft ?? 0),
      currency_code: invoice.currency_code,
      discount: money(invoice.discount ?? 0),
      discount_amount: money(invoice.discount_amount ?? 0),
      po_number: invoice.po_number,
      notes: invoice.notes,
      ...optional(invoice, "client_email"),
    },
    InvoiceItem: [
      {
        product_id: correct,
        item: line.item,
        description: line.description,
        unit_price: money(line.unit_price),
        quantity: Number(line.quantity),
        ...optional(line, "tax1"),
        ...optional(line, "tax2"),
        ...optional(line, "store_id"),
      },
    ],
    Payment: payments.map((p) => ({
      payment_method: p.payment_method,
      amount: money(p.amount),
      transaction_id: text(p.transaction_id),
      date: text(p.date).slice(0, 10),
      ...optional(p, "treasury_id"),
      ...optional(p, "status"),
    })),
  };
}

// what must not change: the total, the paid amount, every payment, the line (but its product)
function differences(before: Live, after: Live, correct: number) {
  const diffs: string[] = [];
  const same = (label: string, a: unknown, b: unknown) => {
    if (text(a) !== text(b)) diffs.push(`${label}: ${text(a)} → ${text(b)}`);
  };
  const sameMoney = (label: string, a: unknown, b: unknown) => {
    if (money(a) !== money(b)) diffs.push(`${label}: ${money(a)} → ${money(b)}`);
  };

  same("invoice no", before.invoice.no, after.invoice.no);
  sameMoney("total", before.invoice.summary_total, after.invoice.summary_total);
  sameMoney("paid", before.invoice.summary_paid, after.invoice.summary_paid);
  sameMoney("unpaid", before.invoice.summary_unpaid, after.invoice.summary_unpaid);
  same("lines", before.items.length, after.items.length);
  same("payments", before.payments.length, after.payments.length);

  const [b, a] = [before.items[0], after.items[0]];
  if (a) {
    if (Number(a.product_id) !== correct) diffs.push(`product: ${text(a.product_id)} (expected ${correct})`);
    same("item", b.item, a.item);
    same("description", b.description, a.description);
    sameMoney("unit price", b.unit_price, a.unit_price);
    same("quantity", Number(b.quantity), Number(a.quantity));
    same("tax", b.tax1, a.tax1);
  }

  before.payments.forEach((p, i) => {
    const q = after.payments[i];
    if (!q) return;
    same(`payment ${i + 1} method`, p.payment_method, q.payment_method);
    sameMoney(`payment ${i + 1} amount`, p.amount, q.amount);
    same(`payment ${i + 1} transaction`, p.transaction_id, q.transaction_id);
    same(`payment ${i + 1} date`, text(p.date).slice(0, 10), text(q.date).slice(0, 10));
    same(`payment ${i + 1} treasury`, p.treasury_id, q.treasury_id);
  });
  return diffs;
}

const row = (cells: (string | number)[]) =>
  cells.map((c, i) => String(c).padEnd([7, 10, 9, 20, 0][i] ?? 0)).join(" ");

async function main() {
  console.log(`mode: ${APPLY ? "APPLY (writes)" : "dry run (read-only)"}${ONLY ? ` | only #${ONLY}` : ""}`);
  console.log(`products: 30→${env.products[30]} 45→${env.products[45]} 60→${env.products[60]}`);

  const docs = await prisma.daftraInvoice.findMany({
    where: {
      type: DaftraDocType.INVOICE,
      state: DaftraSyncState.SENT,
      daftraId: { not: null },
      ...(ONLY && { orderId: ONLY }),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderId: true,
      daftraId: true,
      daftraNo: true,
      payload: true,
      order: {
        select: {
          meeting: { orderBy: { session: "asc" }, take: 1, select: { duration: true } },
        },
      },
    },
  });
  console.log(`SENT invoices: ${docs.length}\n`);

  const toFix: { doc: (typeof docs)[number]; live: Live; duration: number; correct: number }[] = [];
  const skipped: string[] = [];
  let correctAlready = 0;

  console.log(row(["oid", "daftraNo", "duration", "current → correct", "refunds"]));

  for (const [i, doc] of docs.entries()) {
    if (i > 0) await pause();

    const duration = Number(doc.order.meeting[0]?.duration);
    const correct = env.products[duration as 30 | 45 | 60];
    if (!correct) {
      skipped.push(`#${doc.orderId}: no product for a "${doc.order.meeting[0]?.duration ?? "-"}" minute session`);
      continue;
    }

    const live = await getInvoice(doc.daftraId!);
    if (!live) {
      skipped.push(`#${doc.orderId}: GET /invoices/${doc.daftraId}.json failed`);
      continue;
    }
    if (live.items.length !== 1) {
      skipped.push(`#${doc.orderId}: ${live.items.length} lines, not touched`);
      continue;
    }

    const current = Number(live.items[0].product_id);
    if (current === correct) {
      correctAlready++;
      continue;
    }

    // refund receipts are never touched, only counted so they can be checked by hand
    const refunds = await prisma.daftraInvoice.count({
      where: { orderId: doc.orderId, type: DaftraDocType.REFUND, state: DaftraSyncState.SENT },
    });
    console.log(
      row([doc.orderId, doc.daftraNo ?? "-", `${duration} min`, `${current} → ${correct}`, refunds]),
    );
    toFix.push({ doc, live, duration, correct });
  }

  console.log(`\nto fix: ${toFix.length} | already correct: ${correctAlready} | skipped: ${skipped.length}`);
  skipped.forEach((s) => console.log(`  skipped ${s}`));

  if (!APPLY) {
    console.log("\ndry run: nothing changed. run with --apply to write.");
    return;
  }

  let fixed = 0;
  for (const { doc, live, correct } of toFix) {
    await pause();
    const put = await daftra("PUT", `/invoices/${doc.daftraId}.json`, editBody(live, correct));
    if (put.status < 200 || put.status >= 300 || put.json?.result !== "successful") {
      console.error(
        `\nSTOP: PUT #${doc.orderId} (daftra ${doc.daftraId}) http ${put.status} ${text(put.json?.message)} ${put.json?.validation_errors ? JSON.stringify(put.json.validation_errors) : ""}`,
      );
      process.exit(1);
    }

    await pause();
    const after = await getInvoice(doc.daftraId!);
    const diffs = after ? differences(live, after, correct) : ["the GET after the PUT failed"];
    if (diffs.length) {
      console.error(`\nSTOP: #${doc.orderId} (daftra ${doc.daftraId}) changed after the PUT:`);
      diffs.forEach((d) => console.error(`  ${d}`));
      process.exit(1);
    }

    // the stored payload follows (refund receipts read their line's product from it)
    const payload = doc.payload as { InvoiceItem?: Json[] } | null;
    if (payload?.InvoiceItem?.[0]) {
      payload.InvoiceItem[0].product_id = correct;
      await prisma.daftraInvoice.update({
        where: { id: doc.id },
        data: { payload: payload as Prisma.InputJsonValue },
      });
    }

    fixed++;
    console.log(`fixed #${doc.orderId} (daftra ${doc.daftraId}, ${doc.daftraNo ?? "-"}): product → ${correct}, verified`);
  }

  console.log(`\ndone: ${fixed} of ${toFix.length} fixed`);
}

main()
  .catch((err) => {
    console.error("error:", err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
