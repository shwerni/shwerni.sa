// revlaidate each 7 days
export const revalidate = 604800;

// React & Next
import type { MetadataRoute } from "next";

// prisma data
import { siteMapDynamic } from "@/data/seo";
import { getSitemapCenters } from "@/data/center/centers";

// constants
import { mainRoute } from "@/constants/links";
import { CENTERS_ENABLED } from "@/constants/centers";

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

  // dynamic routes (canonical paths: /consultant/:cid redirects to /consultants/:cid)
  const dynamicRoutes: MetadataRoute.Sitemap = [
    ...consultants.map((c) => ({
      url: `${mainRoute}consultants/${c.cid}`,
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

  // centers: /centers, each published center and its public consultants (from launch)
  const centerRoutes: MetadataRoute.Sitemap = [];
  if (CENTERS_ENABLED) {
    const centers = await getSitemapCenters();
    centerRoutes.push({
      url: `${mainRoute}centers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    });
    for (const c of centers) {
      centerRoutes.push({
        url: `${mainRoute}centers/${c.slug}`,
        lastModified: c.updated_at,
        changeFrequency: "weekly",
        priority: 0.7,
      });
      for (const k of c.consultants)
        centerRoutes.push({
          url: `${mainRoute}centers/${c.slug}/consultants/${k.cid}`,
          lastModified: k.updated_at,
          changeFrequency: "monthly",
          priority: 0.6,
        });
    }
  }

  // return
  return [...staticRoutes, ...dynamicRoutes, ...centerRoutes];
}

// // React & Next
// import type { MetadataRoute } from "next";

// // prisma data
// import { siteMapArticles, siteMapConsultants } from "@/data/seo";

// // constants
// import { mainRoute } from "@/constants/links";

// export const revalidate = 43200; // 12h

// export async function generateSitemaps() {
//   return [{ id: 0 }, { id: 1 }, { id: 2 }];
// }

// export default async function sitemap(props: {
//   id: Promise<string>;
// }): Promise<MetadataRoute.Sitemap> {
//   // id
//   const id = Number(await props.id);

//   // last deploy date
//   const last = new Date("2026-01-01");

//   switch (id) {
//     // static pages
//     case 0:
//       return [
//         {
//           url: mainRoute,
//           lastModified: last,
//           changeFrequency: "monthly",
//           priority: 1.0,
//         },
//         {
//           url: `${mainRoute}consultant`,
//           lastModified: last,
//           changeFrequency: "weekly",
//           priority: 0.9,
//         },
//         {
//           url: `${mainRoute}articles`,
//           lastModified: last,
//           changeFrequency: "weekly",
//           priority: 0.8,
//         },
//         {
//           url: `${mainRoute}discover`,
//           lastModified: last,
//           changeFrequency: "weekly",
//           priority: 0.7,
//         },
//         {
//           url: `${mainRoute}contact-us`,
//           lastModified: last,
//           changeFrequency: "yearly",
//           priority: 0.5,
//         },
//       ];

//     // consultants
//     case 1: {
//       const consultants = await siteMapConsultants();
//       return (consultants ?? []).map((c) => ({
//         url: `${mainRoute}consultant/${c.cid}`,
//         lastModified: c.updated_at,
//         changeFrequency: "monthly" as const,
//         priority: 0.7,
//       }));
//     }

//     // articles
//     case 2: {
//       const articles = await siteMapArticles();
//       return (articles ?? []).map((a) => ({
//         url: `${mainRoute}articles/${a.aid}`,
//         lastModified: a.created_at,
//         changeFrequency: "monthly" as const,
//         priority: 0.6,
//       }));
//     }

//     default:
//       return [];
//   }
// }
