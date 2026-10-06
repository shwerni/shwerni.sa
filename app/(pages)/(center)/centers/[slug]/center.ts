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

import { getCenterMembership } from "@/data/center/require-center";

// lib
import { userServer } from "@/lib/auth/server";

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

// the center a page shows: the published one, or a preview of a hidden one for an admin (any
// center) or a member of that center (its own center only). the session is read only when the
// published lookup misses, so published pages stay cached
export async function resolveCenter(
  slug: string,
): Promise<{ center: PublicCenter; preview: boolean } | null> {
  const published = await fetchPublishedCenter(slug);
  if (published) return { center: published, preview: false };

  const user = await userServer();
  if (user?.role !== UserRole.ADMIN && user?.role !== UserRole.CENTER) return null;

  const center = await getCenterBySlugAnyStatus(slug);
  if (!center) return null;
  if (user.role === UserRole.ADMIN) return { center, preview: true };

  // a center account previews its own center only
  const member = user.id ? await getCenterMembership(user.id) : null;
  return member?.centerId === center.ceid ? { center, preview: true } : null;
}
