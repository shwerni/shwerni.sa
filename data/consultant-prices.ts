import "server-only";

// prisma types
import type { Prisma } from "@/lib/generated/prisma/client";

// utils
import { toLegacyColumns } from "@/utils/pricing";

/**
 * the update data for a price save (the dual-write): the costs json = the stored map with the new
 * prices merged in, plus the cost30 / cost45 / cost60 columns for the lengths the save holds (a
 * length it doesn't hold keeps its column). never Consultant.durations: only the admin dashboard
 * sets the override
 * @param stored the consultant's current costs json
 * @param costs the checked prices ("30" → price), from checkPrices
 */
export function consultantPriceData(
  stored: unknown,
  costs: Record<string, number>,
): { costs: Prisma.InputJsonValue; cost30?: number; cost45?: number; cost60?: number } {
  const base =
    stored && typeof stored === "object" && !Array.isArray(stored)
      ? (stored as Record<string, unknown>)
      : {};
  return {
    costs: { ...base, ...costs } as Prisma.InputJsonValue,
    ...toLegacyColumns(costs),
  };
}
