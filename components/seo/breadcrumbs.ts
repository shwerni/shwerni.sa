// types
import type { BreadcrumbList } from "schema-dts";

// constants
import { mainRoute } from "@/constants/links";

// home › section › page; paths without the leading slash. "الرئيسية" is the header's home link
export function breadcrumbList(
  items: { name: string; path: string }[],
): BreadcrumbList {
  const trail = [{ name: "الرئيسية", path: "" }, ...items];

  return {
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${mainRoute}${item.path}`,
    })),
  };
}
