// React & Next
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
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";

// scripts
import MetaPixel from "@/app/_components/layout/scripts/ads/metaPixel";
import SnapPixel from "@/app/_components/layout/scripts/ads/snapPixel";
import TwitterPixel from "@/app/_components/layout/scripts/ads/twitterPixel";

// css
import "@/app/globals.css";

// constants
import { defaultMetaApi } from "@/constants";
import { uploadThingRouterConfig } from "@/lib/upload/provider";

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
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      dir="rtl"
      // lang="en"
      // suppressHydrationWarning
    >
      {/* google analytic */}
      <GoogleAnalytics gaId="G-DRN37CDE50" />
      {/* google ads mangaer */}
      <GoogleTagManager gtmId="GTM-5TGBGMNN" />
      {/* main app */}
      <body className={font.className}>
        <ReCaptchaWrapper>
          <main className="max-w-[1750px] mx-auto">
            {/* uplaod thing */}
            <NextSSRPlugin routerConfig={uploadThingRouterConfig} />
            {/* top loader animation */}
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
