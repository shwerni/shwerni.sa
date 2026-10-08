// React & Next
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

// google tag manager: lazy, with early clicks queued for it (scripts/ads/gtm.ts)
import Script from "next/script";

// top loader
import NextTopLoader from "nextjs-toploader";

// nuqs
import { NuqsAdapter } from "nuqs/adapters/next/app";

// real-user performance (vercel speed insights)
import { SpeedInsights } from "@vercel/speed-insights/next";

// components
import { Toaster } from "@/components/ui/sonner";

// scripts
import MetaPixel from "@/components/legacy/layout/scripts/ads/metaPixel";
import SnapPixel from "@/components/legacy/layout/scripts/ads/snapPixel";
import TwitterPixel from "@/components/legacy/layout/scripts/ads/twitterPixel";
import { GTM_LOAD, GTM_QUEUE } from "@/components/legacy/layout/scripts/ads/gtm";

// css
import "@/app/globals.css";

// constants
import { defaultMetaApi } from "@/constants";

// font
const font = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  // weight: ["100", "200", "300", "400", "500", "600", "700"],
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
      {/* the gtm click queue: a plain inline script, so it runs while the html is parsed, before
          any click is possible (next's beforeInteractive only runs once next's own js has loaded) */}
      <head>
        <script id="gtm-queue" dangerouslySetInnerHTML={{ __html: GTM_QUEUE }} />
      </head>
      {/* main app */}
      <body className={font.className}>
        <main className="max-w-437.5 mx-auto">
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
        {/* real-user web vitals */}
        <SpeedInsights />
        {/* google ads mangaer: gtm.js loads after the page load (or on the first early click) */}
        <Script id="gtm-load" strategy="lazyOnload">
          {GTM_LOAD}
        </Script>
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
