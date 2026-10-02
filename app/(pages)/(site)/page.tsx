// React & Next
import type { Metadata } from "next";

// components
import Home from "@/components/clients/home";
import { JsonLd } from "@/components/seo/json-ld";
import { organizationId, websiteId } from "@/components/seo/site-json-ld";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi, siteDescription, siteTitle } from "@/constants";

// title and description come from defaultMetaApi; the home page owns the canonical
export const metadata: Metadata = {
  alternates: {
    canonical: mainRoute,
    languages: { "ar-SA": mainRoute },
  },
  openGraph: { ...defaultMetaApi.openGraph, url: mainRoute },
};

const Page = async () => {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${mainRoute}#webpage`,
          url: mainRoute,
          name: siteTitle,
          description: siteDescription,
          inLanguage: "ar-SA",
          isPartOf: { "@id": websiteId },
          about: { "@id": organizationId },
        }}
      />
      <Home />
    </>
  );
};

export default Page;
