// React & Next
import { cacheLife } from "next/cache";

// prisma data
import { siteMapPrograms } from "@/data/seo";

// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// published programs, revalidated weekly
async function entries() {
  "use cache";
  cacheLife("weeks");
  const rows = await siteMapPrograms();
  return rows.map((p) => ({
    url: pageUrl(`programs/${p.prid}`),
    lastModified: p.updated_at,
  }));
}

// /sitemaps/programs.xml
export async function GET() {
  return urlsetResponse(await entries());
}
