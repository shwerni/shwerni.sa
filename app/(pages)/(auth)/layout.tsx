// React & Next
import type { Metadata } from "next";

// constants
import { mainRoute } from "@/constants/links";

// meta data seo
const ogImage = {
  url: `${mainRoute}meta/auth.jpeg`,
  alt: "شاورني",
  type: "image/jpeg",
  width: 1200,
  height: 630,
};

const title = "شاورني - تسجيل الدخول وإنشاء حساب";
const description =
  "سجّل دخولك أو أنشئ حسابك في شاورني للوصول إلى جلساتك واستشاراتك بسرية تامة.";

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "شاورني",
    "shwerni",
    "مستشار نفسي",
    "مستشار أسري",
    "تسجيل دخول",
    "إنشاء حساب",
    "علاج نفسي",
    "therapy",
  ],
  robots: { index: false, follow: true },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${mainRoute}auth`,
    siteName: "شاورني | Shwerni",
    locale: "ar_SA",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    creator: "@shwernisa",
    images: [ogImage],
  },
  icons: `${mainRoute}favicon.ico`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
