// vat as an integer percent
export const TAX_PERCENT = 15;

// the one tax calculation for the whole site: checkout, Pay, gateway payloads (web and
// mobile), webhook and mobile checks, order cards, refund dialog, wallet refunds and tabby
// order history. integer math, so 150 → 173 everywhere (float math gave 57 or 58 for 50)
export function withTax(total: number) {
  // total is the stored, rounded pre-tax price
  return Math.round((Math.round(total) * (100 + TAX_PERCENT)) / 100);
}
