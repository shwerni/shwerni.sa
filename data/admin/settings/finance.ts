// primsa types
import { FinanceConfig } from "@/types/data";

// primsa data
import { PaymentMethod } from "@/lib/generated/prisma/enums";
import { getExtractSettings, getSettingsByCategory } from "./settings";

// constants
import { defaultFinance, defaultPleadingCommission } from "@/constants/admin";

// types
type Finance = { tax: number | null; commission: number | null };
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

// pleading orders: the consultant's share (finance/pleadingCommission, same meaning as
// finance/commission). it wins over the consultant's own rate; a missing or invalid value
// falls back to the default (80, the platform takes 20%)
export const getPleadingCommission = async (): Promise<number> => {
  try {
    const finance = await getExtractSettings<{ pleadingCommission?: number }>(
      "finance",
      ["pleadingCommission"],
    );

    const value = Number(finance?.pleadingCommission);
    return Number.isInteger(value) && value > 0 && value <= 100
      ? value
      : defaultPleadingCommission;
  } catch {
    return defaultPleadingCommission;
  }
};
