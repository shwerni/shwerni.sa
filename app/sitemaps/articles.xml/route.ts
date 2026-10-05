// React & Next
import { cacheLife } from "next/cache";

// prisma data
import { siteMapArticles } from "@/data/seo";

// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// published articles, revalidated weekly (lastmod: created_at, the table has no updated_at)
async function entries() {
  "use cache";
  cacheLife("weeks");
  const rows = await siteMapArticles();
  return rows.map((a) => ({
    url: pageUrl(`articles/${a.aid}`),
    lastModified: a.created_at,
  }));
}

// /sitemaps/articles.xml
export async function GET() {
  return urlsetResponse(await entries());
}
