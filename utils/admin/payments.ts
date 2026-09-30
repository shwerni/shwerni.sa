// calculate total
export function calculatePayment({
  baseCost,
  tax,
  discountPercent = 0,
  walletCredit = 0,
  useWallet = false,
}: {
  baseCost: number;
  tax: number;
  discountPercent?: number | null;
  walletCredit?: number;
  useWallet?: boolean;
}) {
  const subTotal = discountPercent
  ? baseCost - (baseCost * discountPercent) / 100
  : baseCost;
  
  const walletUsed = useWallet ? Math.min(walletCredit, subTotal) : 0;
  
  const total = subTotal - walletUsed;
  const totalWTax = total * (1 + tax / 100);

  return {
    totalWTax: Math.round(totalWTax),
    subTotal: Math.round(subTotal),
    total: Math.round(total),
    walletUsed: Math.round(walletUsed),
  };
}

// the tax-inclusive amount charged for an order, from its stored pre-tax total and tax.
// the one source for Pay's charge, every gateway payload (web and mobile) and every
// webhook / mobile amount check. same formula as calculatePayment's totalWTax
export function orderChargeTotal({ total, tax }: { total: number; tax: number }) {
  return calculatePayment({ baseCost: total, tax }).totalWTax;
}
