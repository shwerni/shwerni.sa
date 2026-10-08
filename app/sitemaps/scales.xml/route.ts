// React & Next
import { cacheLife } from "next/cache";

// prisma data
import { siteMapScales } from "@/data/seo";

// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// the scales list and every active scale, revalidated weekly
async function entries() {
  "use cache";
  cacheLife("weeks");
  const rows = await siteMapScales();
  return [
    { url: pageUrl("scales") },
    ...rows.map((s) => ({
      url: pageUrl(`scales/${s.slug}`),
      lastModified: s.updatedAt,
    })),
  ];
}

// /sitemaps/scales.xml
export async function GET() {
  return urlsetResponse(await entries());
}
