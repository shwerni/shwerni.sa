import "server-only";

// packages
import { createHmac, timingSafeEqual } from "node:crypto";

export type SignatureCheck = "valid" | "missing" | "malformed" | "mismatch" | "secret_missing";

/**
 * meta's webhook signature: X-Hub-Signature-256 is "sha256=" + the hex HMAC-SHA256 of the RAW
 * request body, keyed with the meta app secret. compared in constant time
 * @param rawBody the request body exactly as received (before any json parsing)
 * @param header the X-Hub-Signature-256 header, if any
 * @param secret the meta app secret (META_APP_SECRET), if set
 */
export function checkWhatsappSignature(
  rawBody: Buffer,
  header: string | null,
  secret: string | undefined,
): SignatureCheck {
  if (!secret) return "secret_missing";
  if (!header) return "missing";

  const match = /^sha256=([0-9a-f]{64})$/i.exec(header.trim());
  if (!match) return "malformed";

  const expected = createHmac("sha256", secret).update(rawBody).digest();
  const given = Buffer.from(match[1], "hex");
  return given.length === expected.length && timingSafeEqual(given, expected) ? "valid" : "mismatch";
}

/**
 * should this webhook request be processed? "log": always (as before), the result logged;
 * "enforce": only a valid signature. a missing secret is logged on every request (loudly in
 * "enforce", where it refuses everything). the logs never hold the secret or the body
 * @param check checkWhatsappSignature's result
 * @param mode WHATSAPP_SIGNATURE_MODE
 */
export function acceptWhatsappWebhook(check: SignatureCheck, mode: "log" | "enforce"): boolean {
  if (check === "valid") {
    console.log(`[whatsapp-signature] valid mode=${mode}`);
    return true;
  }

  if (check === "secret_missing") {
    if (mode === "enforce") {
      console.error(
        "[whatsapp-signature] META_APP_SECRET missing: every webhook request is refused (mode=enforce)",
      );
      return false;
    }
    console.warn("[whatsapp-signature] secret missing mode=log (processed)");
    return true;
  }

  const processed = mode === "log";
  console.warn(
    `[whatsapp-signature] invalid reason=${check} mode=${mode} ${processed ? "(processed)" : "(refused)"}`,
  );
  return processed;
}
