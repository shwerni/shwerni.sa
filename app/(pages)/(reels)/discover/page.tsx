// React & Next
import { Metadata } from "next";

// get data
import Discover from "@/components/clients/discover/discover";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// auth
import { userServer } from "@/lib/auth/server";
import { mainRoute } from "@/constants/links";

const ogImage = {
  url: `${mainRoute}meta/discover.jpeg`,
  alt: "اكتشف المستشارين حسب وقتك | شاورني",
  type: "image/jpeg",
  width: 1200,
  height: 630,
};

export const metadata: Metadata = {
  title: "اكتشف المستشارين حسب وقتك",
  description:
    "استخدم ميزة الاكتشاف الجديدة لحجز جلستك الاستشارية بناءً على وقتك المفضل. اختر التاريخ والوقت وشاهد المستشارين المتاحين فوراً بكل سهولة.",

  keywords: [
    "حجز استشارة حسب الوقت",
    "مستشارين متاحين الآن",
    "تحديد موعد استشارة",
    "اكتشف مستشارك",
    "أقرب موعد استشارة نفسية",
    "Find a consultant by time",
    "Schedule session shwerni",
  ],

  alternates: {
    canonical: "/discover",
  },

  openGraph: {
    title: "اكتشف المستشارين حسب وقتك | شاورني",
    description:
      "ميزة جديدة تتيح لك اختيار المستشار الأنسب بناءً على جدولك الزمني المفضل.",
    url: `${mainRoute}discover`,
    siteName: "شاورني | Shwerni",
    locale: "ar_SA",
    type: "website",
    images: [ogImage],
  },

  twitter: {
    card: "summary_large_image",
    title: "اكتشف المستشارين حسب وقتك | شاورني",
    description:
      "احجز جلستك القادمة بكل سهولة. اختر الوقت، تصفح المستشارين، وابدأ جلستك.",
    creator: "@shwernisa",
    images: [ogImage],
  },
};

const Page = async () => {
  // user
  const user = await userServer();

  // get finance
  const finance = await getFinanceConfig();

  return <Discover user={user} finance={finance} />;
};

export default Page;
