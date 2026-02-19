// React & Next
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";

// google analytic
import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";

// top loader
import NextTopLoader from "nextjs-toploader";

// auth
import { auth } from "@/auth";
import { SessionProvider } from "next-auth/react";

// nuqs
import { NuqsAdapter } from "nuqs/adapters/next/app";

// components
import { Toaster } from "@/components/ui/sonner";

// css
import "@/app/globals.css";

// constants
import { defaultMetaApi } from "@/constants";
import { GoogleReCaptchaProvider } from "react-google-recaptcha-v3";
import ReCaptchaWrapper from "@/components/wrappers/recaptcha";

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
      {/* <GoogleAnalytics gaId="G-DRN37CDE50" /> */}
      {/* google ads mangaer */}
      {/* <GoogleTagManager gtmId="GTM-5TGBGMNN" /> */}
      {/* main app */}
      <body className={font.className}>
        <ReCaptchaWrapper>
          <main className="max-w-[1750px] mx-auto">
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
    </html>
  );
}
