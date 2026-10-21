// React & Next
import { NextResponse } from "next/server";

// packages
import { z } from "zod";
import { UTApi } from "uploadthing/server";

// prisma data
import {
  claimPleadingDocument,
  completePleadingDocument,
  getPleadingDocumentForPdf,
  markPleadingDocumentFailed,
} from "@/data/pleading-documents";

// lib
import { renderPleadingPdf } from "@/lib/pleading-pdf/render";
import { verifyInternalSecret } from "@/lib/auth/internal-secret";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// the pleading agreement pdf: renders one PleadingDocument (loaded from the database by its id,
// nothing else from the body), uploads it with UTApi, posts it in the case chat and marks the row
// READY. safe to call twice: the row is claimed (RENDERING) before rendering, so a retry or a
// duplicate call never uploads or posts twice, and a version a newer quote replaced is never
// posted. the only function with chromium (next.config.ts traces it here only; vercel.json gives
// it 2048 MB). callers reach it over http (lib/pleading-pdf/request.ts), never by import. a
// missing or wrong x-internal-secret answers 404

export const maxDuration = 60;

const bodySchema = z.object({ documentId: z.string().trim().min(1).max(64) });

const notFound = () => new NextResponse(null, { status: 404 });

// every other method answers 404 too (next's default 405 would tell a caller the route exists)
export const GET = notFound;
export const PUT = notFound;
export const PATCH = notFound;
export const DELETE = notFound;

export async function POST(request: Request) {
  if (!verifyInternalSecret(request)) return notFound();

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ status: "invalid_body" }, { status: 400 });

  const { documentId } = parsed.data;
  const doc = await getPleadingDocumentForPdf(documentId);
  if (!doc) return NextResponse.json({ status: "not_found" }, { status: 404 });

  // already generated: never rendered or uploaded twice
  if (doc.state === "READY" && doc.fileUrl)
    return NextResponse.json({ status: "ready", fileUrl: doc.fileUrl, fileKey: doc.fileKey });
  if (doc.state === "SUPERSEDED") return NextResponse.json({ status: "superseded" });

  // the claim: one caller renders; the others answer busy (or superseded) and do nothing
  const claim = await claimPleadingDocument(documentId);
  if (claim !== "claimed") return NextResponse.json({ status: claim });

  // the case number and version only: no client data in logs or alerts
  const label = `pleading #${doc.plid} ${doc.kind} v${doc.version}`;
  const utapi = new UTApi();
  let uploadedKey: string | null = null;
  try {
    const started = Date.now();
    const pdf = await renderPleadingPdf(doc.input);

    const name = `pleading-${doc.plid}-v${doc.version}${doc.kind === "FINAL" ? "-final" : ""}.pdf`;
    const uploaded = await utapi.uploadFiles(
      new File([new Uint8Array(pdf)], name, { type: "application/pdf" }),
    );
    if (uploaded.error || !uploaded.data)
      throw new Error(`upload failed: ${uploaded.error?.code ?? "no data"}`);
    uploadedKey = uploaded.data.key;

    const fileUrl = uploaded.data.ufsUrl ?? uploaded.data.url;
    const done = await completePleadingDocument(documentId, { url: fileUrl, key: uploadedKey });

    // replaced by a newer version, or another render finished first: this file is never posted
    if (done !== "ready") {
      await utapi.deleteFiles(uploadedKey).catch(() => {});
      console.info(`[pleading-pdf] ${label} ${done}, upload removed`);
      return NextResponse.json({ status: done });
    }

    console.info(`[pleading-pdf] ${label} ready ${pdf.length} bytes in ${Date.now() - started} ms`);
    return NextResponse.json({ status: "ready", fileUrl, fileKey: uploadedKey });
  } catch (err) {
    const reason = err instanceof Error ? err.message : "unexpected error";
    console.error(`[pleading-pdf] ${label} failed`, reason);
    if (uploadedKey) await utapi.deleteFiles(uploadedKey).catch(() => {});
    await markPleadingDocumentFailed(documentId, reason).catch(() => {});
    await telegramAdmin(`pleading-pdf: #${doc.plid} v${doc.version} failed`).catch(() => {});
    return NextResponse.json({ status: "failed" }, { status: 500 });
  }
}
