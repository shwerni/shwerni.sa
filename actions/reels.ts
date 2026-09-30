"use server";

// hotfix wrappers for the /reels page: same signatures and return shapes as
// app/(pages)/(site)/(sub-pages)/reels/actions.ts, which is now server-only

// prisma data
import {
  getAvailableTimesForDate as getAvailableTimesForDateData,
  getConsultantsAvailableAt as getConsultantsAvailableAtData,
} from "@/app/(pages)/(site)/(sub-pages)/reels/actions";

// public
export async function getAvailableTimesForDate(
  ...args: Parameters<typeof getAvailableTimesForDateData>
) {
  return getAvailableTimesForDateData(...args);
}

// public
export async function getConsultantsAvailableAt(
  ...args: Parameters<typeof getConsultantsAvailableAtData>
) {
  return getConsultantsAvailableAtData(...args);
}
