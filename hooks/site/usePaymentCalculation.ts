"use client";
import * as React from "react";

// utils
import { withTax } from "@/utils/tax";

interface Wallet {
  credit: number;
}

interface Params {
  baseCost: number;
  // kept for callers; the tax part uses the shared withTax (TAX_PERCENT) so checkout equals the charge
  tax: number;
  wallet?: Wallet | null;
  initialDiscount?: number | null;
}

export function usePaymentCalculation({
  baseCost,
  wallet,
  initialDiscount = null,
}: Params) {
  /* =========================
     Wallet
     ========================= */
  const isWallet = wallet?.credit != null && wallet.credit > 0;

  const calcWallet = React.useCallback(
    (amount: number) => {
      if (!isWallet) return 0;
      return Math.min(wallet!.credit, amount);
    },
    [wallet, isWallet],
  );

  /* =========================
     States
     ========================= */
  const [useWallet, setUseWallet] = React.useState(false);
  const [discount, setDiscount] = React.useState<number | null>(
    initialDiscount,
  );

  const calcSubTotal = React.useCallback(() => {
    // apply discount BEFORE tax
    return discount ? baseCost - (baseCost * discount) / 100 : baseCost;
  }, [baseCost, discount]);

  const [total, setTotal] = React.useState<number>(calcSubTotal()); // before tax
  const [withdrawPay, setWithdrawPay] = React.useState<number>(
    calcWallet(total),
  );
  const [totalWTax, setTotalWTax] = React.useState<number>(withTax(total)); // after tax

  /* =========================
     Sync discount from props
     ========================= */
  React.useEffect(() => {
    setDiscount(initialDiscount ?? null);
  }, [initialDiscount]);

  /* =========================
     Recalculate totals whenever something changes
     ========================= */
  React.useEffect(() => {
    const nextTotal = calcSubTotal();
    const walletUsed = calcWallet(nextTotal);
    const finalTotal = useWallet ? nextTotal - walletUsed : nextTotal;
    // same calculation Pay charges: the rounded total, then integer tax
    const finalTotalWTax = withTax(finalTotal);

    setTotal(nextTotal);
    setWithdrawPay(walletUsed);
    setTotalWTax(finalTotalWTax);
  }, [calcSubTotal, calcWallet, useWallet]);

  /* =========================
     API
     ========================= */
  return {
    total: Math.round(total),
    totalWTax,
    subTotal: withTax(baseCost),
    withdrawPay: Math.round(withdrawPay),
    discount,
    setDiscount,
    useWallet,
    setUseWallet,
    isWallet,
  };
}
