import "server-only";

// constants
import { mainRoute } from "@/constants/links";

// lib
import { INTERNAL_SECRET_HEADER } from "@/lib/auth/internal-secret";

// the caller's side of /api/internal/pleading-pdf: always over http, never an import of the
// renderer (that would pull chromium into the caller's function). the base url:
// - INTERNAL_BASE_URL when set (an explicit override)
// - production (VERCEL_ENV=production): the site's own domain (mainRoute), which deployment
//   protection never covers
// - a preview (VERCEL_ENV=preview): the deployment's own url (VERCEL_URL), with the
//   x-vercel-protection-bypass header when VERCEL_AUTOMATION_BYPASS_SECRET exists (vercel sets it
//   once "Protection Bypass for Automation" is enabled); without it a protected preview answers 401
// - anything else (local dev): http://localhost:$PORT (3000 by default)

export function internalBaseUrl(): string {
  const override = process.env.INTERNAL_BASE_URL?.trim();
  if (override) return override.replace(/\/+$/, "");
  if (process.env.VERCEL_ENV === "production") return mainRoute.replace(/\/+$/, "");
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL)
    return `https://${process.env.VERCEL_URL}`;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export type PleadingPdfResult =
  | { ok: true; fileUrl: string }
  | { ok: false; status: string; httpStatus?: number };

// asks the route to render and upload one PleadingDocument. it never throws: a failure comes back
// as { ok: false } (the route has already marked the row FAILED and alerted when it got that far)
export async function requestPleadingPdf(documentId: string): Promise<PleadingPdfResult> {
  const secret = process.env.INTERNAL_SHARED_SECRET;
  if (!secret) return { ok: false, status: "no_secret" };

  const bypass = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
  try {
    const res = await fetch(`${internalBaseUrl()}/api/internal/pleading-pdf`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        [INTERNAL_SECRET_HEADER]: secret,
        ...(process.env.VERCEL_ENV === "preview" && bypass
          ? { "x-vercel-protection-bypass": bypass }
          : {}),
      },
      body: JSON.stringify({ documentId }),
      cache: "no-store",
      // the route's own limit is 60 s
      signal: AbortSignal.timeout(65_000),
    });
    const body = (await res.json().catch(() => null)) as { status?: string; fileUrl?: string } | null;
    if (res.ok && body?.status === "ready" && body.fileUrl) return { ok: true, fileUrl: body.fileUrl };
    return { ok: false, status: body?.status ?? "http_error", httpStatus: res.status };
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return { ok: false, status: timeout ? "timeout" : "network_error" };
  }
}
