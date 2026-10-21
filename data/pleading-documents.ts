import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types (types only: a runtime import would keep these enums in the enums module every
// function shares, see docs/progress.md phase 2)
import type {
  PleadingDocumentKind,
  PleadingDocumentState,
} from "@/lib/generated/prisma/enums";

const QUOTE: PleadingDocumentKind = "QUOTE";
const FINAL: PleadingDocumentKind = "FINAL";
const READY: PleadingDocumentState = "READY";
const FAILED: PleadingDocumentState = "FAILED";
const RENDERING: PleadingDocumentState = "RENDERING";
const SUPERSEDED: PleadingDocumentState = "SUPERSEDED";

// lib
import type { PleadingPdfInput } from "@/lib/pleading-pdf/template";

// the case agreement documents (PleadingDocument). the pdf route reads its input only from here,
// never from a request body

const asTerms = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((t): t is string => typeof t === "string") : [];

// a document's pdf input, its state and the case number, or null when it doesn't exist. a FINAL
// takes the consultant's acknowledgement date from the QUOTE version it accepts
export async function getPleadingDocumentForPdf(id: string) {
  const doc = await prisma.pleadingDocument.findUnique({
    where: { id },
    select: {
      id: true,
      kind: true,
      state: true,
      version: true,
      termsVersion: true,
      clientName: true,
      consultantName: true,
      caseType: true,
      summary: true,
      consultantTerms: true,
      notes: true,
      fileUrl: true,
      fileKey: true,
      acceptedAt: true,
      createdAt: true,
      pleadingId: true,
      pleading: { select: { plid: true, requestedAt: true } },
    },
  });
  if (!doc) return null;

  const quote =
    doc.kind === FINAL
      ? await prisma.pleadingDocument.findUnique({
          where: {
            pleadingId_kind_version: {
              pleadingId: doc.pleadingId,
              kind: QUOTE,
              version: doc.version,
            },
          },
          select: { createdAt: true },
        })
      : null;

  const input: PleadingPdfInput = {
    kind: doc.kind,
    version: doc.version,
    termsVersion: doc.termsVersion,
    plid: doc.pleading.plid,
    requestedAt: doc.pleading.requestedAt,
    clientName: doc.clientName,
    consultantName: doc.consultantName,
    caseType: doc.caseType,
    summary: doc.summary,
    consultantTerms: asTerms(doc.consultantTerms),
    notes: doc.notes,
    consultantAcknowledgedAt: quote?.createdAt ?? doc.createdAt,
    clientAcceptedAt: doc.acceptedAt,
  };

  return {
    id: doc.id,
    kind: doc.kind,
    state: doc.state,
    version: doc.version,
    plid: doc.pleading.plid,
    fileUrl: doc.fileUrl,
    fileKey: doc.fileKey,
    input,
  };
}

// how long a RENDERING claim holds: past the route's 60 s limit, a claim is a render that died
// (the case page's "stuck" and canRetryPleadingDocument use the same 2 minutes)
const CLAIM_STALE = "2 minutes";
const CLAIM_STALE_MS = 2 * 60_000;

// claims the render: RENDERING only from PENDING, FAILED or a stale RENDERING, and only while no
// newer version of the same kind exists. one statement, so of two concurrent calls one wins.
// "superseded" marks a PENDING or FAILED row that a newer version replaced
export async function claimPleadingDocument(
  id: string,
): Promise<"claimed" | "superseded" | "busy"> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE pleading_documents d
    SET state = 'RENDERING', "updatedAt" = now(), "lastError" = NULL
    WHERE d.id = ${id}
      AND (d.state IN ('PENDING', 'FAILED')
        OR (d.state = 'RENDERING' AND d."updatedAt" < now() - ${CLAIM_STALE}::interval))
      AND NOT EXISTS (
        SELECT 1 FROM pleading_documents n
        WHERE n."pleadingId" = d."pleadingId" AND n.kind = d.kind AND n.version > d.version
      )
    RETURNING d.id`;
  if (rows.length) return "claimed";

  // not claimable: a newer version replaced it (mark it), or another render holds it
  const superseded = await prisma.$queryRaw<{ id: string }[]>`
    UPDATE pleading_documents d SET state = 'SUPERSEDED', "updatedAt" = now()
    WHERE d.id = ${id} AND d.state IN ('PENDING', 'FAILED')
      AND EXISTS (
        SELECT 1 FROM pleading_documents n
        WHERE n."pleadingId" = d."pleadingId" AND n.kind = d.kind AND n.version > d.version
      )
    RETURNING d.id`;
  return superseded.length ? "superseded" : "busy";
}

// the uploaded pdf of a claimed (RENDERING) QUOTE document, in one transaction under a lock on
// the case row (quotePleading updates that row too, so a re-quote and this check can't cross):
// - a newer version exists → SUPERSEDED, nothing posted ("superseded": the caller deletes the file)
// - the claim was lost (no longer RENDERING) → nothing posted ("lost")
// - otherwise ONE file message (OWNER, this case) stamped 1 ms after this version's quote
//   message, so it sits right after it in the chat, then READY with the url, key and message id.
//   the message is written here directly, never through sendPleadingMessage: no chat whatsapp
//   (pleading_quoted already told the client about the quote)
export async function completePleadingDocument(
  id: string,
  file: { url: string; key: string },
): Promise<"ready" | "superseded" | "lost"> {
  return prisma.$transaction(async (tx) => {
    const doc = await tx.pleadingDocument.findUnique({
      where: { id },
      select: {
        kind: true,
        version: true,
        state: true,
        createdAt: true,
        pleadingId: true,
        pleading: { select: { plid: true } },
      },
    });
    if (!doc || doc.state !== RENDERING) return "lost";
    // FINAL documents (the paid agreement) are posted by phase 5's code
    if (doc.kind !== QUOTE) throw new Error("only QUOTE documents are posted here");

    await tx.$queryRaw`SELECT id FROM pleadings WHERE id = ${doc.pleadingId} FOR UPDATE`;

    const newer = await tx.pleadingDocument.count({
      where: { pleadingId: doc.pleadingId, kind: doc.kind, version: { gt: doc.version } },
    });
    if (newer) {
      await tx.pleadingDocument.update({ where: { id }, data: { state: SUPERSEDED } });
      return "superseded";
    }

    const message = await tx.orderMessage.create({
      data: {
        pleadingId: doc.pleadingId,
        sender: "OWNER",
        content: `اتفاقية التكليف (النسخة ${doc.version})`,
        fileUrl: file.url,
        fileType: "application/pdf",
        fileName: `اتفاقية-التكليف-${doc.pleading.plid}-v${doc.version}.pdf`,
        createdAt: new Date(doc.createdAt.getTime() + 1),
      },
      select: { id: true },
    });

    const { count } = await tx.pleadingDocument.updateMany({
      where: { id, state: RENDERING },
      data: { state: READY, fileUrl: file.url, fileKey: file.key, messageId: message.id, lastError: null },
    });
    // a stale takeover finished first: roll the message back
    if (!count) throw new LostClaim();
    return "ready";
  }).catch((err) => {
    if (err instanceof LostClaim) return "lost" as const;
    throw err;
  });
}

class LostClaim extends Error {}

// a failed render or upload of a claimed row: FAILED with a short reason
export async function markPleadingDocumentFailed(id: string, error: string) {
  await prisma.pleadingDocument.updateMany({
    where: { id, state: RENDERING },
    data: { state: FAILED, lastError: error.slice(0, 500) },
  });
}

// a case's QUOTE versions for the consultant's case page, newest first: state, file, and the
// agreement fields (the newest prefills a re-quote), and stuck (a stale RENDERING claim, which a
// retry takes over). never a price: documents have none
export async function listPleadingDocuments(pleadingId: string) {
  const rows = await prisma.pleadingDocument.findMany({
    where: { pleadingId, kind: QUOTE },
    orderBy: { version: "desc" },
    select: {
      id: true,
      version: true,
      state: true,
      fileUrl: true,
      createdAt: true,
      updatedAt: true,
      caseType: true,
      summary: true,
      consultantTerms: true,
      notes: true,
    },
  });
  const now = Date.now();
  return rows.map((row) => ({
    ...row,
    stuck: row.state === RENDERING && now - row.updatedAt.getTime() > CLAIM_STALE_MS,
  }));
}
