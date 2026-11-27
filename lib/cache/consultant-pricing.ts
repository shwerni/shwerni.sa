import "server-only";

// React & Next
import { revalidateTag } from "next/cache";

// constants
import { consultantPricingTag } from "@/constants/pricing";

/**
 * after a consultant's prices change: purge the cached reads that show them (the consultant page,
 * the home cards, the center's consultant list). each purge in its own try/catch, so it never fails
 * the save that called it
 * @param cid the consultant
 * @param centerId the consultant's center, null for a platform consultant
 */
export function purgeConsultantPricing(cid: number, centerId: number | null) {
  const tags = [consultantPricingTag(cid), "consultants"];
  if (centerId !== null) tags.push(`center-consultants:${centerId}`);

  for (const tag of tags) {
    try {
      revalidateTag(tag, "max");
    } catch (err) {
      console.error(`[pricing] revalidateTag ${tag} failed`, err);
    }
  }
  return tags;
}
