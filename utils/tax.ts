// vat as an integer percent
export const TAX_PERCENT = 15;

// the one tax calculation for the whole site: checkout, Pay, gateway payloads (web and
// mobile), webhook and mobile checks, order cards, refund dialog, wallet refunds and tabby
// order history. integer math, so 150 → 173 everywhere (float math gave 57 or 58 for 50)
export function withTax(total: number) {
  // total is the stored, rounded pre-tax price
  return Math.round((Math.round(total) * (100 + TAX_PERCENT)) / 100);
}

// remove after 2026-10-09: transition for orders created before the integer tax deploy.
// set this to the deploy time. a later value only widens what pre-deploy orders may match;
// an earlier value can send orders created just before the deploy to hold.
export const LEGACY_CHARGE_CUTOFF = new Date("2026-10-02T00:00:00+03:00");

// remove after 2026-10-09: every amount (in sar) a payment may carry for this order.
// new orders: withTax(total) only. orders created before the cutoff also accept what the old
// formulas charged: round(t × 1.15) over the unrounded price t (only round(t) was stored, so
// t is within ±0.5 of total), and the old totalAfterTax(total)
export function acceptedChargeAmounts(
  total: number,
  createdAt: Date | null | undefined,
): number[] {
  const amounts = new Set([withTax(total)]);

  // remove after 2026-10-09: pre-cutoff orders only
  if (createdAt && createdAt < LEGACY_CHARGE_CUTOFF) {
    // old calculatePayment float formula, over every price that rounds to total
    const low = Math.round((total - 0.5) * (1 + 15 / 100));
    const high = Math.round((total + 0.5 - 1e-9) * (1 + 15 / 100));
    for (let a = low; a <= high; a++) amounts.add(a);
    amounts.add(Math.round(total * (1 + 15 / 100)));
    // old totalAfterTax
    amounts.add(Math.round(total + (total * 15) / 100));
  }

  return [...amounts];
}
