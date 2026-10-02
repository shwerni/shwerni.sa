// React & Next
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

// google analytic
import { GoogleTagManager } from "@next/third-parties/google";

// top loader
import NextTopLoader from "nextjs-toploader";

// nuqs
import { NuqsAdapter } from "nuqs/adapters/next/app";

// components
import { Toaster } from "@/components/ui/sonner";

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
        {/* google ads mangaer */}
        <GoogleTagManager gtmId="GTM-5TGBGMNN" />
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
