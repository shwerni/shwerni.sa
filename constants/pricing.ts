// constants
import { INSTANT_DURATION } from "@/constants/instant";

// one bookable session length and its price limits (sar, before tax)
export interface DurationCatalogEntry {
  minutes: number;
  min: number;
  max?: number;
  // the daftra product invoiced for this length (parsed now, used from pricing step 6)
  daftraProductId?: number;
}

// the pricing settings (category "pricing"), as getPricingSettings returns them
export interface PricingSettings {
  // every session length the platform offers, with its minimum (and maximum, when set) price
  catalog: DurationCatalogEntry[];
  // the single-session lengths of a consultant without an override
  defaultDurations: number[];
  // the largest discount a package may give (stored now, applied in a later step)
  maxPackageDiscountPercent: number;
  // the daftra product for a length whose catalog entry has none; null when not set (parsed now,
  // used from pricing step 6)
  daftraDefaultProductId: number | null;
}

// the settings rows: category and sub keys
export const PRICING_SETTINGS_CATEGORY = "pricing";
export const PRICING_SETTING_KEYS = {
  catalog: "durationCatalog",
  defaultDurations: "defaultDurations",
  maxPackageDiscountPercent: "maxPackageDiscountPercent",
  daftraDefaultProductId: "daftraDefaultProductId",
} as const;

// the defaults: today's hardcoded values, used when a row is missing or invalid
export const DEFAULT_DURATION_CATALOG: readonly DurationCatalogEntry[] = [
  { minutes: 30, min: 120 },
  { minutes: 45, min: 155 },
  { minutes: 60, min: 175 },
];
export const DEFAULT_DURATIONS: readonly number[] = [30, 60];
export const DEFAULT_MAX_PACKAGE_DISCOUNT_PERCENT = 40;

// a fresh copy of the defaults each time, so no caller can change the shared ones
export const defaultPricingSettings = (): PricingSettings => ({
  catalog: DEFAULT_DURATION_CATALOG.map((entry) => ({ ...entry })),
  defaultDurations: [...DEFAULT_DURATIONS],
  maxPackageDiscountPercent: DEFAULT_MAX_PACKAGE_DISCOUNT_PERCENT,
  daftraDefaultProductId: null,
});

// every package session is this long (its price is the package's, not the consultant's per-duration price)
export const PACKAGE_SESSION_MINUTES = 45;

// lengths the catalog must always hold: instant sessions and package sessions are fixed products
export const REQUIRED_CATALOG_MINUTES: readonly number[] = [INSTANT_DURATION, PACKAGE_SESSION_MINUTES];

// catalog bounds for one entry's length
export const CATALOG_MINUTES_MIN = 5;
export const CATALOG_MINUTES_MAX = 240;

// guard until the real-overlap booking work ships (pricing plan, "Requirement before step 4"): the
// slot rules assume a session of at most an hour, so a longer catalog entry is dropped (alone,
// with the reason logged). removed in the same commit as the overlap work
export const CATALOG_GUARD_MAX_MINUTES = 60;

// the per-duration prices kept in the legacy columns (cost30 / cost45 / cost60) during the transition
export const LEGACY_COST_COLUMNS = {
  30: "cost30",
  45: "cost45",
  60: "cost60",
} as const;

// cache tags the dashboard purges (POST /api/revalidate) and the main site's saves revalidate
export const PRICING_SETTINGS_TAG = "pricing-settings";
export const consultantPricingTag = (cid: number) => `consultant:${cid}`;
