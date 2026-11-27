// prices by length in minutes ("30" → price): only the lengths a consultant offers, plus fixed products
export type Cost = Record<string, number>;

// types
export type FinanceConfig = {
  tax: number;
  commission: number;
  payments: PaymentMethod[];
  couponEnabled: boolean;
};
