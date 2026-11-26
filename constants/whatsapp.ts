// the whatsapp webhook's signature check (app/api/whatsapp/route.ts, lib/api/whatsapp/signature.ts):
// "log" verifies and logs every request but processes it as before; "enforce" refuses (401) any
// request without a valid X-Hub-Signature-256. enforced since 2026-11-27, after the "log" period
// showed only valid requests
export const WHATSAPP_SIGNATURE_MODE: "log" | "enforce" = "enforce";
