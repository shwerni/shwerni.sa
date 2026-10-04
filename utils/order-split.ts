// center orders: the platform/center split, written once when the payment becomes PAID
// (docs/centers/CENTERS_SPEC.md §7). base = Payment.total: after discount, before vat
const round2 = (n: number) => Math.round(n * 100) / 100;

// centerShare = base - platformShare, so the two always sum exactly
export function computeOrderSplit({
  paidBeforeVat,
  platformRate,
}: {
  paidBeforeVat: number;
  platformRate: number;
}) {
  const platformShare = round2((paidBeforeVat * platformRate) / 100);
  return { platformShare, centerShare: round2(paidBeforeVat - platformShare) };
}

// fields to add to the PAID update: center orders only, and only if not written yet.
// Payment.commission on a center order is the center's %, so the platform rate is 100 - commission
export function paidSplit(
  centerId: number | null,
  payment: { total: number; commission: number; platformShare: number | null },
) {
  if (centerId === null || payment.platformShare !== null) return {};
  return computeOrderSplit({
    paidBeforeVat: payment.total,
    platformRate: 100 - payment.commission,
  });
}

// a share after refunds: reduced by refundedBeforeVat / paidBeforeVat (§3.4).
// refunds are recorded in sar with vat and Payment.tax is a percent, so the vat is taken out first
export function shareAfterRefunds({
  share,
  paidBeforeVat,
  refunded,
  taxPercent,
}: {
  share: number;
  paidBeforeVat: number;
  refunded: number;
  taxPercent: number;
}) {
  if (paidBeforeVat <= 0) return 0;
  const refundedBeforeVat = (refunded * 100) / (100 + taxPercent);
  const ratio = Math.min(1, Math.max(0, refundedBeforeVat / paidBeforeVat));
  return round2(share * (1 - ratio));
}
