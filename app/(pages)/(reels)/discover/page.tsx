// React & Next
import { Metadata } from "next";

// get data
import Discover from "@/components/clients/discover/discover";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// auth
import { userServer } from "@/lib/auth/server";

export const metadata: Metadata = {
  title: "اكتشف المستشارين حسب وقتك",
  description:
    "استخدم ميزة الاكتشاف الجديدة لحجز جلستك الاستشارية بناءً على وقتك المفضل. اختر التاريخ والوقت وشاهد المستشارين المتاحين فوراً بكل سهولة.",

  // Custom keywords for this feature
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
    url: "/discover",
    type: "website",
  },

  twitter: {
    title: "اكتشف المستشارين حسب وقتك | شاورني",
    description:
      "احجز جلستك القادمة بكل سهولة. اختر الوقت، تصفح المستشارين، وابدأ جلستك.",
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
