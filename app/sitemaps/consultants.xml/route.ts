// React & Next
import { cacheLife } from "next/cache";

// prisma data
import { siteMapConsultants } from "@/data/seo";

// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// active platform consultants, revalidated weekly. no lastmod: Consultant.updated_at also moves
// on presence (online status) updates, so it doesn't mean the profile changed
async function entries() {
  "use cache";
  cacheLife("weeks");
  const rows = await siteMapConsultants();
  return rows.map((c) => ({ url: pageUrl(`consultants/${c.cid}`) }));
}

// /sitemaps/consultants.xml
export async function GET() {
  return urlsetResponse(await entries());
}
