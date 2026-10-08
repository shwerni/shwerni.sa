// React & Next
import { cacheLife, cacheTag } from "next/cache";

// prisma data
import { siteMapArticles } from "@/data/seo";

// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// published articles, revalidated weekly or on the "articles" tag (dashboard edits).
// lastmod: the last content change, or the publish date while updated_at is still null
async function entries() {
  "use cache";
  cacheLife("weeks");
  cacheTag("articles");
  const rows = await siteMapArticles();
  return rows.map((a) => ({
    url: pageUrl(`articles/${a.aid}`),
    lastModified: a.updated_at ?? a.created_at,
  }));
}

// /sitemaps/articles.xml
export async function GET() {
  return urlsetResponse(await entries());
}
