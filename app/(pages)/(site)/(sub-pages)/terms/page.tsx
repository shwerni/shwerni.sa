// React & Next
import { Metadata } from "next";

// components
import Terms from "@/components/clients/terms";
import { PageJsonLd } from "@/components/seo/page-json-ld";

// constants
import { defaultMetaApi } from "@/constants";
import { mainRoute } from "@/constants/links";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني".
// /privacy redirects here (next.config.ts), so this page is also the privacy policy
const title = "الشروط والأحكام";
const fullTitle = `${title} | شاورني`;
const description = "الشروط والأحكام وسياسة الخصوصية لمنصة شاورني";
const url = `${mainRoute}terms`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: url },
  openGraph: { ...defaultMetaApi.openGraph, title: fullTitle, description, url },
  twitter: { ...defaultMetaApi.twitter, title: fullTitle, description },
};

// page
export default async function Page() {
  return (
    <>
      <PageJsonLd
        type="WebPage"
        path="terms"
        name={fullTitle}
        description={description}
      />
      <Terms />
    </>
  );
}
