// sitemap helpers: one sitemap per page type under a sitemap index, so search console reports
// indexing per type. route handlers (not metadata sitemap.ts files) give readable urls:
//   /sitemap.xml                  the index (app/sitemap.xml/route.ts)
//   /sitemaps/<type>.xml          one per type (app/sitemaps/<type>.xml/route.ts)
// "_lib" is a private folder, never a route

// constants
import { mainRoute } from "@/constants/links";
import { CENTERS_ENABLED } from "@/constants/centers";

// a sitemap url. lastModified is the row's stored date; static pages omit it
export type SitemapEntry = { url: string; lastModified?: Date };

// the sitemap types, in index order (centers only from launch)
export const sitemapTypes = [
  "static",
  "consultants",
  "articles",
  "programs",
  ...(CENTERS_ENABLED ? (["centers"] as const) : []),
] as const;

// the absolute url of a page path ("" is the home page, matching its canonical)
export const pageUrl = (path: string) => `${mainRoute}${path}`;

// the absolute url of a type's sitemap
export const sitemapUrl = (type: string) => `${mainRoute}sitemaps/${type}.xml`;

// xml text escaping (& < > " ')
const escapeXml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&apos;",
  );

const xmlResponse = (body: string) =>
  new Response(body, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });

// a <urlset> sitemap
export const urlsetResponse = (entries: SitemapEntry[]) =>
  xmlResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      entries
        .map(
          (e) =>
            `<url>\n<loc>${escapeXml(e.url)}</loc>\n` +
            (e.lastModified ? `<lastmod>${e.lastModified.toISOString()}</lastmod>\n` : "") +
            `</url>`,
        )
        .join("\n") +
      `\n</urlset>\n`,
  );

// the <sitemapindex>
export const sitemapIndexResponse = (urls: string[]) =>
  xmlResponse(
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
      `<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
      urls.map((u) => `<sitemap>\n<loc>${escapeXml(u)}</loc>\n</sitemap>`).join("\n") +
      `\n</sitemapindex>\n`,
  );
