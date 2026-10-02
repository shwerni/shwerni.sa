// types
import type { Organization, WebSite } from "schema-dts";

// components
import { JsonLd } from "@/components/seo/json-ld";

// constants
import { mainRoute } from "@/constants/links";
import { socialMedia } from "@/constants/data";

// shared @ids, so pages can point at the organization and the website
export const organizationId = `${mainRoute}#organization`;
export const websiteId = `${mainRoute}#website`;

// the official profiles are the ones the footer links to (whatsapp is a contact channel,
// not a profile); tracking parameters are dropped
const sameAs = socialMedia
  .filter((i) => i.label !== "whatsapp")
  .map((i) => {
    const url = new URL(i.link);
    url.search = "";
    return url.toString();
  });

// only what the site shows: the footer's city and contact details, the four consultation
// categories it offers
const organization: Organization = {
  "@type": "Organization",
  "@id": organizationId,
  name: "شاورني",
  alternateName: "shwerni",
  url: mainRoute,
  logo: {
    "@type": "ImageObject",
    url: `${mainRoute}layout/logo.png`,
    width: "750",
    height: "225",
  },
  image: `${mainRoute}layout/shwerni.jpg`,
  sameAs,
  address: {
    "@type": "PostalAddress",
    addressLocality: "الرياض",
    addressCountry: "SA",
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    telephone: "+966554117879",
    email: "support@shwerni.com",
    availableLanguage: ["Arabic"],
    areaServed: "SA",
  },
  areaServed: { "@type": "Country", name: "Saudi Arabia" },
  knowsAbout: [
    "استشارات نفسية",
    "استشارات أسرية",
    "استشارات زوجية",
    "استشارات قانونية",
    "استشارات شخصية",
    "Mental health counseling",
    "Marriage counseling",
  ],
};

const website: WebSite = {
  "@type": "WebSite",
  "@id": websiteId,
  url: mainRoute,
  name: "شاورني",
  alternateName: "shwerni",
  inLanguage: "ar-SA",
  description:
    "منصة استشارات سعودية أونلاين — استشارات نفسية وأسرية وزوجية مع أفضل المستشارين",
  publisher: { "@id": organizationId },
};

// rendered once by the (site) layout
export function SiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [organization, website],
      }}
    />
  );
}
