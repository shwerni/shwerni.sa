export type Cost = Record<"30" | "60", number>;

// types
export type FinanceConfig = {
  tax: number;
  commission: number;
  payments: PaymentMethod[];
  couponEnabled: boolean;
};
