import "server-only";

// prisma data
import {
  getDaftraDocument,
  getOrderInvoiceDocument,
  settleReviewDocument,
} from "@/data/daftra";

// lib
import { getDaftraConfig } from "@/lib/daftra/config";
import { daftraGet } from "@/lib/daftra/client";
import { round2 } from "@/lib/daftra/format";

// prisma types
import { DaftraDocType, DaftraSyncState } from "@/lib/generated/prisma/enums";

// settling a REVIEW document from the dashboard (its DAFTRA.md): a REVIEW row's outcome is unknown,
// daftra may have created it, so it is never re-sent blind. a person checks daftra, then:
// - in_daftra: daftra's own copy is read (a GET, never a create) and must be the same document
//   (id, client, total where daftra returns them); the row becomes SENT with its id and number
// - not_in_daftra: the row becomes FAILED, so a normal send or the nightly retry sends it
// nothing is created in daftra here

export type DaftraResolveStatus =
  | "resolved"
  | "not_found" // no such document row
  | "not_review" // the row isn't REVIEW (documentState says what it is)
  | "daftra_not_found" // daftra didn't return that document
  | "mismatch" // daftra's document isn't this one
  | "duplicate" // another row already holds that daftraId
  | "disabled"
  | "failed";

export type DaftraResolveResult = {
  state: boolean;
  status: DaftraResolveStatus;
  documentState?: DaftraSyncState; // the row's state after the call
  daftraId?: number;
  daftraNo?: string;
  message: string;
};

export type DaftraResolveInput =
  | { dedupeKey: string; outcome: "in_daftra"; daftraId: number; daftraNo?: string; actorId: string }
  | { dedupeKey: string; outcome: "not_in_daftra"; actorId: string };

// ---------- daftra's copy ----------

// the fields we compare, from GET /invoices/{id}.json or /refund_receipts/{id}.json (the document
// under data.X or X; a refund receipt may come back as Invoice too). null when unreadable
export type DaftraDocumentFields = {
  id: number | null;
  no: string | null;
  clientId: number | null;
  total: number | null;
};

export function readDaftraDocument(body: unknown): DaftraDocumentFields | null {
  const b = body as { data?: Record<string, unknown> } & Record<string, unknown> | null;
  if (!b || typeof b !== "object") return null;
  const pick = (root: Record<string, unknown> | undefined) =>
    (root?.Invoice ?? root?.RefundReceipt) as Record<string, unknown> | undefined;
  const doc = pick(b.data) ?? pick(b);
  if (!doc || typeof doc !== "object") return null;

  const num = (value: unknown) => {
    const n = Number(value);
    return value === undefined || value === null || value === "" || !Number.isFinite(n) ? null : n;
  };
  return {
    id: num(doc.id),
    no: doc.no === undefined || doc.no === null || doc.no === "" ? null : String(doc.no),
    clientId: num(doc.client_id),
    total: num(doc.summary_total),
  };
}

// why daftra's document isn't the row's (null: it matches). a field daftra didn't return isn't
// compared; the id always must match
export function mismatchReason(
  doc: DaftraDocumentFields,
  expected: { daftraId: number; daftraClientId: number | null; amount: number },
): string | null {
  if (doc.id !== null && doc.id !== expected.daftraId) return `id ${doc.id} ≠ ${expected.daftraId}`;
  if (doc.clientId !== null && expected.daftraClientId !== null && doc.clientId !== expected.daftraClientId)
    return `client ${doc.clientId} ≠ ${expected.daftraClientId}`;
  if (doc.total !== null && Math.abs(round2(doc.total) - round2(expected.amount)) > 0.01)
    return `total ${round2(doc.total)} ≠ ${round2(expected.amount)}`;
  return null;
}

// ---------- the handler ----------

const NOT_REVIEW_MESSAGE = "المستند ليس بانتظار المراجعة";

export async function resolveReviewDocument(input: DaftraResolveInput): Promise<DaftraResolveResult> {
  const row = await getDaftraDocument(input.dedupeKey);
  if (!row) return { state: false, status: "not_found", message: "المستند غير موجود" };
  if (row.state !== DaftraSyncState.REVIEW)
    return { state: false, status: "not_review", documentState: row.state, message: NOT_REVIEW_MESSAGE };

  // safe to resend: back to FAILED, no daftra call
  if (input.outcome === "not_in_daftra") {
    const settled = await settleReviewDocument(row.id, {
      state: DaftraSyncState.FAILED,
      note: `settled from the dashboard: not in daftra (by ${input.actorId})`,
    });
    if (settled !== "settled")
      return { state: false, status: "not_review", message: NOT_REVIEW_MESSAGE };
    return {
      state: true,
      status: "resolved",
      documentState: DaftraSyncState.FAILED,
      message: "يمكن إعادة الإرسال الآن",
    };
  }

  // already in daftra: read daftra's copy and compare before marking it SENT
  const config = getDaftraConfig();
  if (!config.enabled)
    return { state: false, status: "disabled", message: "الربط مع دفترة غير مفعّل" };
  if (!config.ok) return { state: false, status: "failed", message: "إعدادات دفترة غير مكتملة" };

  const path =
    row.type === DaftraDocType.INVOICE
      ? `/invoices/${input.daftraId}.json`
      : `/refund_receipts/${input.daftraId}.json`;
  const body = await daftraGet(config, path);
  const doc = body === null ? null : readDaftraDocument(body);
  if (!doc)
    return { state: false, status: "daftra_not_found", message: "لم يُعثر على المستند في دفترة" };

  const reason = mismatchReason(doc, {
    daftraId: input.daftraId,
    daftraClientId: row.daftraClientId,
    amount: row.amount,
  });
  if (reason) {
    console.error(`[daftra] resolve ${input.dedupeKey} mismatch: ${reason}`);
    return { state: false, status: "mismatch", message: "المستند في دفترة لا يطابق هذا المستند" };
  }

  // a refund receipt keeps its source invoice (set on the REVIEW row, else read from the order)
  const daftraParent =
    row.type === DaftraDocType.REFUND && !row.daftraParent
      ? ((await getOrderInvoiceDocument(row.orderId))?.daftraId ?? null)
      : undefined;

  const daftraNo = input.daftraNo?.trim() || doc.no;
  const settled = await settleReviewDocument(row.id, {
    state: DaftraSyncState.SENT,
    daftraId: input.daftraId,
    daftraNo,
    daftraParent,
    response: body,
  });
  if (settled === "duplicate")
    return { state: false, status: "duplicate", message: "رقم المستند مسجّل لمستند آخر" };
  if (settled !== "settled")
    return { state: false, status: "not_review", message: NOT_REVIEW_MESSAGE };

  return {
    state: true,
    status: "resolved",
    documentState: DaftraSyncState.SENT,
    daftraId: input.daftraId,
    daftraNo: daftraNo ?? undefined,
    message: "تم تسجيل المستند كمرسل إلى دفترة",
  };
}
