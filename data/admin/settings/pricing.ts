import "server-only";

// React & Next
import { cacheLife, cacheTag } from "next/cache";

// prisma db
import prisma from "@/lib/database/db";

// utils
import { parsePricingSettings } from "@/utils/pricing";

// constants
import {
  PRICING_SETTINGS_CATEGORY,
  PRICING_SETTINGS_TAG,
  defaultPricingSettings,
  type PricingSettings,
} from "@/constants/pricing";

// the cached read: the "pricing" settings rows, parsed. a database error throws out of here, so
// it is never cached (the next request retries); invalid or missing keys fall back to their
// defaults inside parsePricingSettings. purged by the PRICING_SETTINGS_TAG tag
const loadPricingSettings = async (): Promise<PricingSettings> => {
  "use cache";
  cacheTag(PRICING_SETTINGS_TAG);
  cacheLife("days");

  const rows = await prisma.setting.findMany({
    where: { category: PRICING_SETTINGS_CATEGORY },
    select: { subKey: true, value: true },
  });

  const { settings, issues } = parsePricingSettings(
    Object.fromEntries(rows.map((row) => [row.subKey, row.value])),
  );
  if (issues.length > 0) console.error(`[pricing-settings] ${issues.join(" | ")}`);
  return settings;
};

/**
 * the pricing settings: the duration catalog with its minimum prices, the default single-session
 * lengths and the package discount cap. cached (tag "pricing-settings"), so a warm read makes no
 * query; a database error answers the defaults (today's values) without caching them
 */
export async function getPricingSettings(): Promise<PricingSettings> {
  try {
    return await loadPricingSettings();
  } catch (err) {
    console.error("[pricing-settings] read failed, using the defaults", err);
    return defaultPricingSettings();
  }
}
