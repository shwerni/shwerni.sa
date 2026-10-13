import "server-only";

// the daftra api: POST json with the apikey header (no Authorization header), 20s timeout.
// three outcomes, because daftra doesn't block duplicates:
// - success: 2xx with result "successful" and a numeric id (it can come back as a string)
// - failed: a definitive rejection, 4xx with a json body (validation_errors kept for lastError)
// - unknown: timeout, network error, 5xx, or a 2xx we can't read. daftra may have created the
//   document, so the caller must never re-send it on its own
export type DaftraResult =
  | { kind: "success"; id: number; number: string | null; body: unknown }
  | { kind: "failed"; status: number; error: string; body: unknown }
  | { kind: "unknown"; error: string; body?: unknown };

const TIMEOUT_MS = 20_000;

// the reason daftra gives, short: message + validation_errors
const describeFailure = (body: unknown) => {
  if (!body || typeof body !== "object") return "rejected";
  const b = body as { message?: unknown; validation_errors?: unknown };
  const message = typeof b.message === "string" ? b.message : "rejected";
  return b.validation_errors
    ? `${message} | ${JSON.stringify(b.validation_errors)}`
    : message;
};

export async function daftraRequest(
  config: { subdomain: string; apiKey: string },
  path: string,
  body: unknown,
): Promise<DaftraResult> {
  let res: Response;
  try {
    res = await fetch(`https://${config.subdomain}.daftra.com/api2${path}`, {
      method: "POST",
      headers: {
        apikey: config.apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const timeout = err instanceof Error && err.name === "TimeoutError";
    return { kind: "unknown", error: timeout ? "timeout" : "network error" };
  }

  const json: unknown = await res.json().catch(() => null);

  if (res.status >= 500)
    return { kind: "unknown", error: `http ${res.status}`, body: json };

  if (res.status >= 400)
    return json
      ? { kind: "failed", status: res.status, error: describeFailure(json), body: json }
      : { kind: "unknown", error: `http ${res.status} without a body` };

  // 2xx: only a readable success with an id counts as created
  const ok = json as { result?: unknown; id?: unknown; invoice_number?: unknown; client_number?: unknown } | null;
  const id = Number(ok?.id);
  if (ok?.result !== "successful" || !Number.isInteger(id) || id <= 0)
    return { kind: "unknown", error: `http ${res.status} unreadable success`, body: json };

  const number = ok.invoice_number ?? ok.client_number;
  return {
    kind: "success",
    id,
    number: number === undefined || number === null ? null : String(number),
    body: json,
  };
}
