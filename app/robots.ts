// React & Next
import type { MetadataRoute } from "next";

// constants
import { mainRoute } from "@/constants/links";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api",
        "/zadmin",
        "/employees",
        "/sessions",
        "/brief",
        "/event",
        "/collaborator",
      ],
    },
    sitemap: `${mainRoute}sitemap.xml`,
  };
}
