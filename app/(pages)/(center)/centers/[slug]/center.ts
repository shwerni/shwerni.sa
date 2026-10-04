// React & Next
import { cacheLife, cacheTag } from "next/cache";

// prisma data
import {
  getCenterBySlugAnyStatus,
  getPublishedCenterBySlug,
  type PublicCenter,
} from "@/data/center/centers";
import {
  getCenterConsultant,
  getCenterConsultants,
} from "@/data/center/consultants";

// lib
import { roleServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// a published center by slug (tag center:{ceid}). a miss is tagged "centers", so publishing
// a center and purging that tag clears it
export async function fetchPublishedCenter(slug: string) {
  "use cache";
  cacheLife("hours");
  const center = await getPublishedCenterBySlug(slug);
  cacheTag(center ? `center:${center.ceid}` : "centers");
  return center;
}

// a center's public consultants (tag center-consultants:{ceid})
export async function fetchCenterConsultants(ceid: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`center-consultants:${ceid}`);
  return getCenterConsultants(ceid);
}

// one public consultant of a center (tag center-consultants:{ceid})
export async function fetchCenterConsultant(ceid: number, cid: number) {
  "use cache";
  cacheLife("hours");
  cacheTag(`center-consultants:${ceid}`);
  return getCenterConsultant(ceid, cid);
}

// the center a page shows: the published one, or any status for an admin preview.
// the session is read only when the published lookup misses, so published pages stay cached
export async function resolveCenter(
  slug: string,
): Promise<{ center: PublicCenter; preview: boolean } | null> {
  const published = await fetchPublishedCenter(slug);
  if (published) return { center: published, preview: false };

  const role = await roleServer();
  if (role !== UserRole.ADMIN) return null;

  const center = await getCenterBySlugAnyStatus(slug);
  return center ? { center, preview: true } : null;
}
