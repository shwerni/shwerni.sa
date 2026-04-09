// React & Next
import { Suspense } from "react";
import { connection } from "next/server";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

// google analytic
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

// top loader
import NextTopLoader from "nextjs-toploader";

// nuqs
import { NuqsAdapter } from "nuqs/adapters/next/app";

// components
import { Toaster } from "@/components/ui/sonner";

// google recaptcha
import ReCaptchaWrapper from "@/components/wrappers/recaptcha";

// upload thing
import { extractRouterConfig } from "uploadthing/server";
import { ourFileRouter } from "@/app/api/uploadthing/core";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";

// scripts
import MetaPixel from "@/components/legacy/layout/scripts/ads/metaPixel";
import SnapPixel from "@/components/legacy/layout/scripts/ads/snapPixel";
import TwitterPixel from "@/components/legacy/layout/scripts/ads/twitterPixel";

// css
import "@/app/globals.css";

// constants
import { defaultMetaApi } from "@/constants";

// font
const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700"],
  display: "swap",
  adjustFontFallback: false,
});

// meta data seo
export const metadata: Metadata = defaultMetaApi;

// view port meta
export const viewport: Viewport = {
  initialScale: 1,
  width: "device-width",
  maximumScale: 1,
  userScalable: false,
  colorScheme: "light",
};

async function UTSSR() {
  await connection();
  return <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      dir="rtl"
      lang="ar"
      suppressHydrationWarning
      data-color-scheme="light"
      className="light"
    >
      <head>
        <JsonLd />
      </head>
      {/* google analytic */}
      <GoogleAnalytics gaId="G-DRN37CDE50" />
      {/* google ads mangaer */}
      <GoogleTagManager gtmId="GTM-5TGBGMNN" />
      {/* main app */}
      <body className={font.className}>
        <ReCaptchaWrapper>
          <main className="max-w-437.5 mx-auto">
            {/* uplaod thing */}
            <Suspense>
              <UTSSR />
            </Suspense>
            {/* top loader */}
            <NextTopLoader />
            {/* nuqs adaptar */}
            <NuqsAdapter>
              {/* children */}
              {children}
            </NuqsAdapter>
          </main>
          {/* toast */}
          <Toaster richColors expand={true} />
        </ReCaptchaWrapper>
      </body>
      {/* meta pixel ads */}
      <MetaPixel />
      {/* twitter ads */}
      <TwitterPixel />
      {/* snap pixel ads */}
      <SnapPixel />
    </html>
  );
}

// below your imports, add this function
function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://shwerni.sa/#website",
        url: "https://shwerni.sa",
        name: "شاورني",
        alternateName: "shwerni",
        inLanguage: "ar-SA",
        description:
          "منصة استشارات سعودية أونلاين — استشارات نفسية وأسرية وزوجية مع أفضل المستشارين",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://shwerni.sa/consultants?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://shwerni.sa/#organization",
        name: "شاورني",
        alternateName: "shwerni",
        url: "https://shwerni.sa",
        logo: {
          "@type": "ImageObject",
          "@id": "https://shwerni.sa/#logo",
          url: "https://shwerni.sa/apple-touch-icon.png",
          contentUrl: "https://shwerni.sa/apple-touch-icon.png",
          caption: "شاورني",
        },
        image: {
          "@type": "ImageObject",
          url: "https://shwerni.sa/layout/shwerni.jpg",
          width: 1200,
          height: 630,
        },
        sameAs: [
          "https://twitter.com/shwernisa",
          // add instagram, snapchat, etc. here
        ],
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "customer support",
          availableLanguage: ["Arabic"],
          areaServed: "SA",
        },
        areaServed: {
          "@type": "Country",
          name: "Saudi Arabia",
        },
        knowsAbout: [
          "استشارات نفسية",
          "استشارات أسرية",
          "استشارات زوجية",
          "استشارات قانونية",
          "استشارات مهنية",
          "Online therapy",
          "Mental health counseling",
          "Marriage counseling",
        ],
      },
      {
        "@type": "WebPage",
        "@id": "https://shwerni.sa/#webpage",
        url: "https://shwerni.sa",
        name: "شاورني - منصة الاستشارات السعودية",
        isPartOf: { "@id": "https://shwerni.sa/#website" },
        about: { "@id": "https://shwerni.sa/#organization" },
        inLanguage: "ar-SA",
        description:
          "منصة استشارات سعودية أونلاين — استشارات نفسية وأسرية وزوجية مع أفضل المستشارين",
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
