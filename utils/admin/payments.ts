// utils
import { withTax } from "@/utils/tax";

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

  return {
    // tax part: the shared integer calculation over the rounded total (tax is TAX_PERCENT)
    totalWTax: withTax(total),
    subTotal: Math.round(subTotal),
    total: Math.round(total),
    walletUsed: Math.round(walletUsed),
  };
}
