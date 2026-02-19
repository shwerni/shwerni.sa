"use client";
import * as React from "react";

interface Wallet {
  credit: number;
}

interface Params {
  baseCost: number;
  tax: number;
  wallet?: Wallet | null;
  initialDiscount?: number | null;
}

export function usePaymentCalculation({
  baseCost,
  tax,
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
  const [totalWTax, setTotalWTax] = React.useState<number>(
    total * (1 + tax / 100),
  ); // after tax

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
    const finalTotalWTax = finalTotal * (1 + tax / 100);

    setTotal(nextTotal);
    setWithdrawPay(walletUsed);
    setTotalWTax(finalTotalWTax);
  }, [calcSubTotal, calcWallet, useWallet, tax]);

  /* =========================
     API
     ========================= */
  return {
    total: Math.round(total),
    totalWTax: Math.round(totalWTax),
    subTotal: Math.round(baseCost * (1 + tax / 100)),
    withdrawPay: Math.round(withdrawPay),
    discount,
    setDiscount,
    useWallet,
    setUseWallet,
    isWallet,
  };
}
