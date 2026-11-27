// packages
import { z } from "zod";

// constants
import {
  CATALOG_GUARD_MAX_MINUTES,
  CATALOG_MINUTES_MAX,
  CATALOG_MINUTES_MIN,
  DEFAULT_BOOKING_MINUTES,
  LEGACY_COST_COLUMNS,
  PRICING_SETTING_KEYS,
  REQUIRED_CATALOG_MINUTES,
  defaultPricingSettings,
  type DurationCatalogEntry,
  type PricingSettings,
} from "@/constants/pricing";

// pricing rules shared by the server and the client (no database access): the settings' shapes,
// a consultant's effective session lengths, the per-duration price schema, and the transition
// helpers between the costs json and the legacy cost30 / cost45 / cost60 columns

// ---------------------------------------------------------------
// the settings rows
// ---------------------------------------------------------------

// a daftra product id (pricing step 6 reads it)
const daftraProductIdSchema = z.number().int().positive();

// one entry. unknown fields are dropped, not refused (zod's default strip, no .strict()): a field
// the dashboard adds later can never reset the catalog to the defaults; the known ones are checked
const catalogEntrySchema = z
  .object({
    minutes: z.number().int().min(CATALOG_MINUTES_MIN).max(CATALOG_MINUTES_MAX),
    min: z.number().positive().finite(),
    max: z.number().positive().finite().optional(),
    daftraProductId: daftraProductIdSchema.optional(),
  })
  .refine((entry) => entry.max === undefined || entry.max > entry.min, {
    message: "max must be greater than min",
  });

// the catalog: at least one entry, each length once, and always the fixed products' lengths
export const durationCatalogSchema = z
  .array(catalogEntrySchema)
  .min(1)
  .superRefine((catalog, ctx) => {
    const minutes = catalog.map((entry) => entry.minutes);
    if (new Set(minutes).size !== minutes.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "duplicate minutes" });
    }
    for (const required of REQUIRED_CATALOG_MINUTES) {
      if (!minutes.includes(required)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `the catalog must include ${required}` });
      }
    }
  });

// the default single-session lengths: a non-empty set (checked against the catalog after parsing)
export const defaultDurationsSchema = z
  .array(z.number().int().positive())
  .min(1)
  .refine((durations) => new Set(durations).size === durations.length, {
    message: "duplicate minutes",
  });

export const maxPackageDiscountPercentSchema = z.number().int().min(0).max(100);

export const daftraDefaultProductIdSchema = daftraProductIdSchema;

/**
 * the >60-minute guard (CATALOG_GUARD_MAX_MINUTES): entries longer than an hour are dropped one by
 * one, each with its reason; the rest of the catalog is kept and validated as usual
 * @param value the durationCatalog row's value
 */
function dropLongCatalogEntries(value: unknown, issues: string[]): unknown {
  if (!Array.isArray(value)) return value;
  return value.filter((entry) => {
    const minutes = (entry as { minutes?: unknown } | null)?.minutes;
    if (typeof minutes === "number" && minutes > CATALOG_GUARD_MAX_MINUTES) {
      issues.push(
        `${PRICING_SETTING_KEYS.catalog}: ${minutes} min is over ${CATALOG_GUARD_MAX_MINUTES} (dropped until the overlap booking work ships)`,
      );
      return false;
    }
    return true;
  });
}

/**
 * the pricing settings from the settings rows' values (category "pricing", by sub key). each key
 * is parsed on its own: a missing or invalid one falls back to its default alone, with the reason
 * in issues. the default lengths must all be in the catalog in use (else they fall back too; and
 * when the defaults don't fit that catalog either, only its lengths among them are kept)
 * catalog entries longer than CATALOG_GUARD_MAX_MINUTES are dropped alone (the guard), and unknown
 * fields of an entry are ignored
 * @param values the rows' values by sub key (durationCatalog, defaultDurations,
 * maxPackageDiscountPercent, daftraDefaultProductId)
 */
export function parsePricingSettings(values: Partial<Record<string, unknown>>): {
  settings: PricingSettings;
  issues: string[];
} {
  const defaults = defaultPricingSettings();
  const issues: string[] = [];

  const read = <T>(key: string, schema: z.ZodType<T>, fallback: T): T => {
    const value =
      key === PRICING_SETTING_KEYS.catalog ? dropLongCatalogEntries(values[key], issues) : values[key];
    if (value === undefined || value === null) return fallback;
    const parsed = schema.safeParse(value);
    if (parsed.success) return parsed.data;
    issues.push(`${key}: ${parsed.error.issues.map((issue) => issue.message).join("; ")}`);
    return fallback;
  };

  const catalog = read<DurationCatalogEntry[]>(
    PRICING_SETTING_KEYS.catalog,
    durationCatalogSchema,
    defaults.catalog,
  ).sort((a, b) => a.minutes - b.minutes);
  const inCatalog = (minutes: number) => catalog.some((entry) => entry.minutes === minutes);

  let defaultDurations = read<number[]>(
    PRICING_SETTING_KEYS.defaultDurations,
    defaultDurationsSchema,
    defaults.defaultDurations,
  );
  if (!defaultDurations.every(inCatalog)) {
    issues.push(`${PRICING_SETTING_KEYS.defaultDurations}: not all in the catalog`);
    defaultDurations = defaults.defaultDurations.filter(inCatalog);
    if (defaultDurations.length === 0) defaultDurations = catalog.map((entry) => entry.minutes);
  }

  const maxPackageDiscountPercent = read<number>(
    PRICING_SETTING_KEYS.maxPackageDiscountPercent,
    maxPackageDiscountPercentSchema,
    defaults.maxPackageDiscountPercent,
  );

  const daftraDefaultProductId = read<number | null>(
    PRICING_SETTING_KEYS.daftraDefaultProductId,
    daftraDefaultProductIdSchema,
    defaults.daftraDefaultProductId,
  );

  return {
    settings: {
      catalog,
      defaultDurations: [...defaultDurations].sort((a, b) => a - b),
      maxPackageDiscountPercent,
      daftraDefaultProductId,
    },
    issues,
  };
}

// ---------------------------------------------------------------
// a consultant's session lengths and prices
// ---------------------------------------------------------------

// one catalog entry, or undefined when the length isn't offered
export const catalogEntryFor = (settings: PricingSettings, minutes: number) =>
  settings.catalog.find((entry) => entry.minutes === minutes);

// the minimum price of one length, or null when the length isn't in the catalog
export const minimumFor = (settings: PricingSettings, minutes: number): number | null =>
  catalogEntryFor(settings, minutes)?.min ?? null;

/**
 * the single-session lengths a consultant sells: their override (Consultant.durations) kept to the
 * catalog's lengths, else the platform default. an empty override, or one with nothing left in the
 * catalog, means the default (like commission's fallback to the platform rate)
 * @param override the consultant's own lengths (empty = none)
 */
export function effectiveDurations(
  settings: PricingSettings,
  override: readonly number[] | null | undefined,
): number[] {
  const own = [...new Set(override ?? [])].filter((minutes) => catalogEntryFor(settings, minutes));
  return (own.length > 0 ? own : [...settings.defaultDurations]).sort((a, b) => a - b);
}

/**
 * the length a booking form preselects: DEFAULT_BOOKING_MINUTES (30) when the consultant offers it,
 * else their first length. a string, as the forms hold it
 * @param durations the consultant's effective lengths (sorted)
 */
export function defaultBookingDuration(durations: readonly number[]): string {
  if (durations.includes(DEFAULT_BOOKING_MINUTES) || durations.length === 0)
    return String(DEFAULT_BOOKING_MINUTES);
  return String(durations[0]);
}

// a meeting's stored length: a whole, positive number of minutes ("30", "45"), never "" or "0"
export const isMeetingDuration = (value: unknown): value is string =>
  typeof value === "string" && /^[1-9]\d*$/.test(value);

/**
 * the price form's schema for these lengths: one required price per length, keyed by its minutes
 * ("30", "60"), at least the catalog's minimum (and at most its maximum, when set). a length that
 * isn't in the catalog gets no field
 * @param durations the consultant's effective lengths (effectiveDurations)
 */
export function createCostsSchema(settings: PricingSettings, durations: readonly number[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const minutes of durations) {
    const entry = catalogEntryFor(settings, minutes);
    if (!entry) continue;
    let price = z.coerce
      .number()
      .positive()
      .safe()
      .min(entry.min, { message: `يجب أن تكون التكلفة ${entry.min} على الأقل` });
    if (entry.max !== undefined) {
      price = price.max(entry.max, { message: `يجب ألا تزيد التكلفة عن ${entry.max}` });
    }
    shape[String(minutes)] = price;
  }
  return z.object(shape) as z.ZodType<Record<string, number>>;
}

// the consultant row's price fields this file reads
export interface ConsultantCostColumns {
  cost30: number;
  cost45: number;
  cost60: number;
  costs?: unknown;
}

/**
 * a consultant's prices by length ("30" → price). during the transition the legacy columns win for
 * 30 / 45 / 60 (the dashboard still writes only those); the costs json is the source only for the
 * lengths without a legacy column. a non-numeric or non-positive json value is ignored
 * @param row the consultant's cost30 / cost45 / cost60 and costs (when selected)
 */
export function readCosts(row: ConsultantCostColumns): Record<string, number> {
  const costs: Record<string, number> = {};

  if (row.costs && typeof row.costs === "object" && !Array.isArray(row.costs)) {
    for (const [key, value] of Object.entries(row.costs as Record<string, unknown>)) {
      const minutes = Number(key);
      const price = Number(value);
      if (Number.isInteger(minutes) && minutes > 0 && Number.isFinite(price) && price > 0) {
        costs[String(minutes)] = price;
      }
    }
  }

  for (const [minutes, column] of Object.entries(LEGACY_COST_COLUMNS)) {
    costs[minutes] = row[column];
  }

  return costs;
}

/**
 * the legacy columns to write next to the costs json (the dual-write): only the lengths the map
 * holds, so a length missing from it leaves its column unchanged
 * @param costs prices by length ("30" → price)
 */
export function toLegacyColumns(
  costs: Record<string, number>,
): Partial<Pick<ConsultantCostColumns, "cost30" | "cost45" | "cost60">> {
  const columns: Partial<Pick<ConsultantCostColumns, "cost30" | "cost45" | "cost60">> = {};
  for (const [minutes, column] of Object.entries(LEGACY_COST_COLUMNS)) {
    const price = costs[minutes];
    if (typeof price === "number" && Number.isFinite(price)) columns[column] = price;
  }
  return columns;
}
