// primsa types
import { FinanceConfig } from "@/types/data";

// primsa data
import { PaymentMethod } from "@/lib/generated/prisma/enums";
import { getExtractSettings, getSettingsByCategory } from "./settings";

// constants
import { defaultFinance } from "@/constants/admin";

// types
type Finance = { tax: number | null; commission: number | null };

// get finance settings
export const getFinanceSettings = async () => {
  // get all settings
  const finance = await getSettingsByCategory("finance");

  // return
  return finance;
};
// get owners current count & increment on it
export const getTaxCommission = async () => {
  try {
    // get all settings
    const finance = await getExtractSettings<Finance>("finance", [
      "tax",
      "commission",
    ]);

    // create one if not exist
    if (!finance)
      // return default values
      return { tax: 15, commission: 60 };

    // return settings
    return { tax: finance.tax || 15, commission: finance.commission || 60 };
  } catch {
    return { tax: 15, commission: 60 };
  }
};

// get payment methods
export const getPaymentMethods = async () => {
  try {
    // get payments methods
    const finance = await getExtractSettings<{ payments: PaymentMethod[] }>(
      "finance",
      ["payments"],
    );

    // validate
    if (!finance) return [];

    // create one if not exist
    if (!finance?.payments)
      // return default values
      return [];

    // return settings
    return finance.payments;
  } catch {
    return [];
  }
};

// get coupon rSettigns state
export const getCouponsState = async () => {
  try {
    // get payments methods
    const finance = await getExtractSettings<{ coupon: boolean }>("features", [
      "coupon",
    ]);

    // create one if not exist
    if (!finance?.coupon)
      // return default values
      return false;

    // return settings
    return finance.coupon;
  } catch (error) {
    return false;
  }
};

export const getFinanceConfig = async (): Promise<FinanceConfig> => {
  try {
    const [finance, features] = await Promise.all([
      getExtractSettings<{
        tax?: number;
        commission?: number;
        payments?: PaymentMethod[];
      }>("finance", ["tax", "commission", "payments"]),

      getExtractSettings<{ coupon?: boolean }>("features", ["coupon"]),
    ]);

    return {
      tax: finance?.tax ?? defaultFinance.tax,
      commission: finance?.commission ?? defaultFinance.commission,
      payments: finance?.payments ?? defaultFinance.payments,
      couponEnabled: features?.coupon ?? defaultFinance.couponEnabled,
    };
  } catch {
    return defaultFinance;
  }
};
