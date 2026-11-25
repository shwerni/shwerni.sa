// the whatsapp webhook's signature check (app/api/whatsapp/route.ts, lib/api/whatsapp/signature.ts):
// "log" verifies and logs every request but processes it as before; "enforce" refuses (401) any
// request without a valid X-Hub-Signature-256. switch to "enforce" after a day of clean logs
// (every request "valid", none "invalid" or "secret missing")
export const WHATSAPP_SIGNATURE_MODE: "log" | "enforce" = "log";
