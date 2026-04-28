// React & Next
import type { MetadataRoute } from "next";

// prisma data
import { siteMapArticles, siteMapConsultants } from "@/data/seo";

// constants
import { mainRoute } from "@/constants/links";

export const revalidate = 43200; // 12h

export async function generateSitemaps() {
  return [{ id: 0 }, { id: 1 }, { id: 2 }];
}

export default async function sitemap(props: {
  id: Promise<string>;
}): Promise<MetadataRoute.Sitemap> {
  // id
  const id = Number(await props.id);

  // last deploy date
  const last = new Date("2026-01-01");

  switch (id) {
    // static pages
    case 0:
      return [
        {
          url: mainRoute,
          lastModified: last,
          changeFrequency: "monthly",
          priority: 1.0,
        },
        {
          url: `${mainRoute}consultant`,
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.9,
        },
        {
          url: `${mainRoute}articles`,
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.8,
        },
        {
          url: `${mainRoute}discover`,
          lastModified: last,
          changeFrequency: "weekly",
          priority: 0.7,
        },
        {
          url: `${mainRoute}contact-us`,
          lastModified: last,
          changeFrequency: "yearly",
          priority: 0.5,
        },
      ];

    // consultants
    case 1: {
      const consultants = await siteMapConsultants();
      return (consultants ?? []).map((c) => ({
        url: `${mainRoute}consultant/${c.cid}`,
        lastModified: c.updated_at,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
    }

    // articles
    case 2: {
      const articles = await siteMapArticles();
      return (articles ?? []).map((a) => ({
        url: `${mainRoute}articles/${a.aid}`,
        lastModified: a.created_at,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));
    }

    default:
      return [];
  }
}
