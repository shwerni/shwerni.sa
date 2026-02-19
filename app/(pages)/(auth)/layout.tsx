// React & Next
import type { Metadata } from "next";

// constants
import { mainRoute } from "@/constants/links";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني -  صفحات الامان",
  description: "shwerni authentication - شاورني الامان",
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
  openGraph: {
    title: "شاورني -  صفحات الامان",
    type: "website",
    url: `${mainRoute}/auth`,
    siteName: "shwerni authentication - شاورني الامان",
    description: "shwerni authentication - شاورني الامان",
    images: [
      {
        url: `${mainRoute}other/auth.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني -  صفحات الامان",
    description: "shwerni authentication - شاورني الامان",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}other/auth.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
