// types
import type { ContactPage, WebPage } from "schema-dts";

// components
import { JsonLd } from "@/components/seo/json-ld";
import { organizationId, websiteId } from "@/components/seo/site-json-ld";

// constants
import { mainRoute } from "@/constants/links";

interface Props {
  type: "WebPage" | "ContactPage";
  // page path without the leading slash, e.g. "terms"
  path: string;
  name: string;
  description: string;
}

// a single content page, part of the website and about the organization
export function PageJsonLd({ type, path, name, description }: Props) {
  const url = `${mainRoute}${path}`;
  const base = {
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "ar-SA",
    isPartOf: { "@id": websiteId },
    about: { "@id": organizationId },
  };

  const page: WebPage | ContactPage =
    type === "ContactPage"
      ? { "@type": "ContactPage", ...base }
      : { "@type": "WebPage", ...base };

  return <JsonLd data={{ "@context": "https://schema.org", ...page }} />;
}
