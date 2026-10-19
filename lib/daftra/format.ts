import "server-only";

// prisma types
import { PaymentMethod } from "@/lib/generated/prisma/enums";

// utils
import { phoneNumber } from "@/utils";
import { TAX_PERCENT } from "@/utils/tax";

// who started a send (kept on the DaftraInvoice row)
export type DaftraSource = "payment" | "dashboard" | "cron";

// the instant a riyadh day (yyyy-MM-dd) starts: riyadh is UTC+3 all year, no DST
export const riyadhDayStart = (day: string) => new Date(`${day}T00:00:00+03:00`);

// what every daftra handler returns
export type DaftraSendStatus =
  | "sent"
  | "already_sent"
  | "already_claimed"
  | "not_eligible"
  | "invoice_not_ready"
  | "client_not_ready"
  | "disabled"
  | "failed"
  | "review"
  // the order is marked "never send to daftra" (Order.daftraSkip): nothing claimed or sent
  | "skipped";

export type DaftraSendResult = {
  state: boolean;
  status: DaftraSendStatus;
  daftraId?: number;
  daftraNo?: string;
  message: string;
};

// a daftra Payment line
export type DaftraPaymentLine = {
  payment_method: string;
  amount: number;
  transaction_id: string;
  date: string;
};

// sar to 2 decimals
export const round2 = (n: number) => Math.round(n * 100) / 100;

// the VAT inside a VAT-inclusive amount (TAX_PERCENT, 15 today)
export const vatInside = (amount: number) =>
  round2(amount - amount / (1 + TAX_PERCENT / 100));

// a date as yyyy-MM-dd in riyadh, whatever the server's time zone
export const riyadhDay = (date: Date) =>
  date.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" });

// the customer key: digits only, as the repo stores every phone (phoneNumber), with a leading
// international "00" dropped so "00966…" and "+966…" are one customer
export const phoneKey = (phone: string) => {
  const digits = phoneNumber(phone);
  return digits.startsWith("00") ? digits.slice(2) : digits;
};

// daftra's phone1: international format, "+" and the digits (the key already has the country code)
export const internationalPhone = (key: string) => `+${key}`;

// our payment method → daftra's payment_method code (the wallet code comes from env)
export const daftraMethodCode = (
  method: PaymentMethod,
  walletMethod: string,
): string => {
  switch (method) {
    case PaymentMethod.visaMoyasar:
      return "manual_payment_19";
    case PaymentMethod.tabby:
      return "tabby";
    case PaymentMethod.transaction:
      return "bank";
    case PaymentMethod.wallet:
      return walletMethod;
  }
};

// the sum of lines, to 2 decimals
export const sumLines = (lines: { amount: number }[]) =>
  round2(lines.reduce((s, l) => s + l.amount, 0));

// a refund split over the source invoice's payment lines in the same proportion as the original
// payment: 2 decimals per line, the last line takes the rounding remainder. lines with no money
// in the source are skipped
export function splitRefund(
  source: { payment_method: string; amount: number }[],
  refund: number,
): { payment_method: string; amount: number }[] {
  const lines = source.filter((l) => l.amount > 0);
  const total = sumLines(lines);
  if (!lines.length || total <= 0) return [];

  let given = 0;
  return lines.map((line, index) => {
    const amount =
      index === lines.length - 1
        ? round2(refund - given)
        : round2((refund * line.amount) / total);
    given = round2(given + amount);
    return { payment_method: line.payment_method, amount };
  });
}
