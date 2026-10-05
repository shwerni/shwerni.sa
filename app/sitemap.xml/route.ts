// sitemap helpers
import {
  sitemapIndexResponse,
  sitemapTypes,
  sitemapUrl,
} from "@/app/sitemaps/_lib/sitemap";

// /sitemap.xml: the sitemap index, one sitemap per page type (robots.ts points here).
// static: the list only changes with CENTERS_ENABLED, at build time
export function GET() {
  return sitemapIndexResponse(sitemapTypes.map(sitemapUrl));
}
