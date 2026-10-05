// React & Next
import { cacheLife } from "next/cache";

// prisma data
import { getSitemapCenters } from "@/data/center/centers";

// sitemap helpers
import {
  pageUrl,
  urlsetResponse,
  type SitemapEntry,
} from "@/app/sitemaps/_lib/sitemap";

// constants
import { CENTERS_ENABLED } from "@/constants/centers";

// the center directory, each published center and its public consultants, revalidated weekly
async function entries() {
  "use cache";
  cacheLife("weeks");
  const centers = await getSitemapCenters();
  const list: SitemapEntry[] = [{ url: pageUrl("centers") }];
  for (const c of centers) {
    list.push({ url: pageUrl(`centers/${c.slug}`), lastModified: c.updated_at });
    for (const k of c.consultants)
      list.push({
        url: pageUrl(`centers/${c.slug}/consultants/${k.cid}`),
        lastModified: k.updated_at,
      });
  }
  return list;
}

// /sitemaps/centers.xml: from launch only (CENTERS_ENABLED); not in the index before that
export async function GET() {
  if (!CENTERS_ENABLED) return new Response("Not Found", { status: 404 });
  return urlsetResponse(await entries());
}
