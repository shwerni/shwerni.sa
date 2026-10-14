import "server-only";

// daftra settings, server-only env (never NEXT_PUBLIC). DAFTRA_ENABLED must be exactly "true" to
// send anything; when it is, every other var is required, or nothing is sent (a config error)
export type DaftraConfig =
  | { enabled: false }
  | { enabled: true; ok: false; missing: string[] }
  | {
      enabled: true;
      ok: true;
      subdomain: string;
      apiKey: string;
      // daftra product ids by session duration (SKU 000001, 000002, 000003)
      products: Record<30 | 45 | 60, number>;
      // daftra payment_method code for wallet money
      walletMethod: string;
      // the go-live day (yyyy-MM-dd, Asia/Riyadh): orders created before it are never sent
      startDate: string;
      // the invoice and refund receipt client_email when the order has no real user email
      // (daftra refuses a document without one for clients set to email invoicing)
      clientEmail: string;
    };

const REQUIRED = [
  "DAFTRA_SUBDOMAIN",
  "DAFTRA_API_KEY",
  "DAFTRA_PRODUCT_ID_30",
  "DAFTRA_PRODUCT_ID_45",
  "DAFTRA_PRODUCT_ID_60",
  "DAFTRA_METHOD_WALLET",
  "DAFTRA_START_DATE",
  "DAFTRA_CLIENT_EMAIL",
] as const;

const productId = (value: string | undefined) => {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
};

// a real calendar day as yyyy-MM-dd (2026-02-30 is refused)
const isoDay = (value: string | undefined) => {
  const day = value?.trim() ?? "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null;
  const date = new Date(`${day}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === day ? day : null;
};

export function getDaftraConfig(): DaftraConfig {
  if (process.env.DAFTRA_ENABLED !== "true") return { enabled: false };

  const missing: string[] = REQUIRED.filter((key) => !process.env[key]?.trim());

  const p30 = productId(process.env.DAFTRA_PRODUCT_ID_30);
  const p45 = productId(process.env.DAFTRA_PRODUCT_ID_45);
  const p60 = productId(process.env.DAFTRA_PRODUCT_ID_60);
  if (process.env.DAFTRA_PRODUCT_ID_30 && !p30) missing.push("DAFTRA_PRODUCT_ID_30 (not a number)");
  if (process.env.DAFTRA_PRODUCT_ID_45 && !p45) missing.push("DAFTRA_PRODUCT_ID_45 (not a number)");
  if (process.env.DAFTRA_PRODUCT_ID_60 && !p60) missing.push("DAFTRA_PRODUCT_ID_60 (not a number)");

  const startDate = isoDay(process.env.DAFTRA_START_DATE);
  if (process.env.DAFTRA_START_DATE?.trim() && !startDate)
    missing.push("DAFTRA_START_DATE (not yyyy-MM-dd)");

  const clientEmail = process.env.DAFTRA_CLIENT_EMAIL?.trim() ?? "";
  if (clientEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail))
    missing.push("DAFTRA_CLIENT_EMAIL (not an email)");

  if (missing.length || !p30 || !p45 || !p60 || !startDate || !clientEmail)
    return { enabled: true, ok: false, missing };

  return {
    enabled: true,
    ok: true,
    subdomain: process.env.DAFTRA_SUBDOMAIN!.trim(),
    apiKey: process.env.DAFTRA_API_KEY!.trim(),
    products: { 30: p30, 45: p45, 60: p60 },
    walletMethod: process.env.DAFTRA_METHOD_WALLET!.trim(),
    startDate,
    clientEmail,
  };
}
