// force dynamic generation
export const dynamic = "force-dynamic";

// React & Next
import type { MetadataRoute } from "next";

// prisma data
import { siteMapDynamic } from "@/data/seo";

// constants
import { mainRoute } from "@/constants/links";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // time
  const now = new Date();

  // static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: mainRoute,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${mainRoute}articles`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${mainRoute}available`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${mainRoute}contact`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${mainRoute}consultant`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${mainRoute}programs`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  // dynamic data
  const data = await siteMapDynamic();

  // validate
  if (!data) return staticRoutes;

  // data
  const { consultants, articles, programs } = data;

  // dynamic routes
  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...consultants.map((c) => ({
      url: `${mainRoute}consultant/${c.cid}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...articles.map((a) => ({
      url: `${mainRoute}articles/${a.aid}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...programs.map((p) => ({
      url: `${mainRoute}programs/${p.prid}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // return
  return [...staticRoutes, ...dynamicRoutes];
}
