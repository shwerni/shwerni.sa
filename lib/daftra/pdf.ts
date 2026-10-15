import "server-only";

// the invoice pdf, fetched on our server the way a client opens it: daftra's invoice_pdf_url
// needs a login, but the hash preview link (invoice_html_url) is public and logs the visitor into
// the client portal as that client (a session cookie). in that session
// /client/invoices/view/{id}.pdf is the real pdf. the file itself goes to whatsapp, never a
// daftra link (the hash link logs anyone into the client's portal). the cookies and the hash are
// never logged or stored

const TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 5;
const MIN_BYTES = 5 * 1024;

export type InvoicePdfResult =
  | { ok: true; buffer: Buffer; contentType: string }
  | { ok: false; reason: string };

// only daftra hosts over https get the cookies (and only they are followed)
const isDaftraUrl = (url: URL) =>
  url.protocol === "https:" &&
  (url.hostname === "daftra.com" || url.hostname.endsWith(".daftra.com"));

// GET with a cookie jar (name=value only), following redirects by hand so every Set-Cookie on
// the way lands in the jar and goes out on the next request
async function getWithJar(
  start: string,
  jar: Map<string, string>,
): Promise<{ ok: true; res: Response } | { ok: false; reason: string }> {
  let url = new URL(start);

  for (let hop = 0; ; hop++) {
    if (!isDaftraUrl(url)) return { ok: false, reason: "redirect outside daftra" };

    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        redirect: "manual",
        headers: {
          ...(jar.size && {
            Cookie: [...jar].map(([name, value]) => `${name}=${value}`).join("; "),
          }),
        },
        cache: "no-store",
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch (err) {
      const timeout = err instanceof Error && err.name === "TimeoutError";
      return { ok: false, reason: timeout ? "timeout" : "network error" };
    }

    for (const cookie of res.headers.getSetCookie()) {
      const pair = cookie.split(";", 1)[0];
      const eq = pair.indexOf("=");
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }

    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel().catch(() => {});
      if (hop >= MAX_REDIRECTS) return { ok: false, reason: "too many redirects" };
      url = new URL(location, url);
      continue;
    }
    return { ok: true, res };
  }
}

// the invoice pdf by its preview link, verified before anything is sent (keep this check): HTTP
// 200, a pdf content-type (application/pdf, or octet-stream with a .pdf attachment filename), the
// %PDF signature and more than 5 KB (a login page fails every one of these)
export async function fetchInvoicePdf(
  htmlUrl: string,
  daftraId: number,
): Promise<InvoicePdfResult> {
  const subdomain = process.env.DAFTRA_SUBDOMAIN?.trim().toLowerCase();
  if (!subdomain) return { ok: false, reason: "no daftra subdomain" };

  let preview: URL;
  try {
    preview = new URL(htmlUrl);
  } catch {
    return { ok: false, reason: "bad preview link" };
  }
  if (!isDaftraUrl(preview)) return { ok: false, reason: "preview link outside daftra" };

  const jar = new Map<string, string>();

  // 1. the preview link: the client portal session
  const session = await getWithJar(preview.toString(), jar);
  if (!session.ok) return { ok: false, reason: `preview ${session.reason}` };
  await session.res.body?.cancel().catch(() => {});
  if (session.res.status !== 200)
    return { ok: false, reason: `preview http ${session.res.status}` };
  if (!jar.size) return { ok: false, reason: "preview gave no session" };

  // 2. the pdf in that session, on our own subdomain (not the host inside the link)
  const pdf = await getWithJar(
    `https://${subdomain}.daftra.com/client/invoices/view/${daftraId}.pdf`,
    jar,
  );
  if (!pdf.ok) return { ok: false, reason: `pdf ${pdf.reason}` };

  const { res } = pdf;
  const contentType = res.headers.get("content-type") ?? "";
  if (res.status !== 200) {
    await res.body?.cancel().catch(() => {});
    return { ok: false, reason: `pdf http ${res.status}` };
  }
  // daftra serves the pdf as application/octet-stream with a ".pdf" attachment filename, so
  // that pair counts too (the %PDF and size checks below still apply)
  const type = contentType.toLowerCase();
  const pdfAttachment =
    type.includes("application/octet-stream") &&
    /filename\*?=[^;]*\.pdf"?\s*(;|$)/i.test(res.headers.get("content-disposition") ?? "");
  if (!type.includes("application/pdf") && !pdfAttachment) {
    await res.body?.cancel().catch(() => {});
    return { ok: false, reason: `content-type ${contentType.split(";")[0] || "missing"}` };
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await res.arrayBuffer());
  } catch {
    return { ok: false, reason: "pdf read error" };
  }
  if (buffer.subarray(0, 4).toString("latin1") !== "%PDF")
    return { ok: false, reason: "not a pdf file" };
  if (buffer.length <= MIN_BYTES)
    return { ok: false, reason: `too small (${buffer.length} bytes)` };

  return { ok: true, buffer, contentType };
}
