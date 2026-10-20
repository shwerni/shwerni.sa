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

// the uploaded pdf: READY with its url and key. a row already READY is left as it is
export async function markPleadingDocumentReady(
  id: string,
  file: { url: string; key: string },
) {
  const { count } = await prisma.pleadingDocument.updateMany({
    where: { id, state: { not: READY } },
    data: {
      state: READY,
      fileUrl: file.url,
      fileKey: file.key,
      lastError: null,
    },
  });
  return count > 0;
}

// a failed render or upload: FAILED with a short reason (never a READY row)
export async function markPleadingDocumentFailed(id: string, error: string) {
  await prisma.pleadingDocument.updateMany({
    where: { id, state: { not: READY } },
    data: { state: FAILED, lastError: error.slice(0, 500) },
  });
}
