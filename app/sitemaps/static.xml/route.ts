// sitemap helpers
import { pageUrl, urlsetResponse } from "@/app/sitemaps/_lib/sitemap";

// indexable pages with their own canonical (no lastmod: their content isn't a dated row).
// the center directory is in centers.xml
const pages = ["", "consultants", "articles", "programs", "coupons", "contact-us", "terms"];

// /sitemaps/static.xml
export function GET() {
  return urlsetResponse(pages.map((p) => ({ url: pageUrl(p) })));
}
