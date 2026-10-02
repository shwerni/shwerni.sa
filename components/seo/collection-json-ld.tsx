// types
import type { CollectionPage, ItemList } from "schema-dts";

// components
import { JsonLd } from "@/components/seo/json-ld";
import { organizationId, websiteId } from "@/components/seo/site-json-ld";

// constants
import { mainRoute } from "@/constants/links";

interface Props {
  // page path without the leading slash, e.g. "consultants"
  path: string;
  name: string;
  description: string;
  // the items the page renders; pass them only for the default, unfiltered first page
  items?: { name: string; path: string }[];
}

// a list page: CollectionPage, with an ItemList of the shown items when given
export function CollectionJsonLd({ path, name, description, items }: Props) {
  const url = `${mainRoute}${path}`;

  const list: ItemList | undefined = items?.length
    ? {
        "@type": "ItemList",
        numberOfItems: items.length,
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          url: `${mainRoute}${item.path}`,
        })),
      }
    : undefined;

  const page: CollectionPage = {
    "@type": "CollectionPage",
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "ar-SA",
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId },
    ...(list && { mainEntity: list }),
  };

  return <JsonLd data={{ "@context": "https://schema.org", ...page }} />;
}
