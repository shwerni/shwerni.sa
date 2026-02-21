// React & Next
import { Metadata } from "next";

// componenets

// prisma types
import { Weekday } from "@/lib/generated/prisma/enums";

// constants
import UnavailableService from "@/components/shared/unavailable-service";
import { mainRoute } from "@/constants/links";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
  description:
    "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
  keywords: [
    "جلسة مجانية",
    "استشارة مجانية",
    "شاورني",
    "مستشار مجاني",
    "مستشار نفسي",
    "استشارات أسرية",
    "شاورني الجلسات المجانية",
    "shwerni",
    "free session",
    "consultants",
    "therapy",
    "mental health",
  ],
  openGraph: {
    title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
    type: "website",
    url: `${mainRoute}/freesession`,
    siteName: "Shwerni.sa",
    description:
      "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
    images: [
      {
        url: `${mainRoute}other/freesession.png`,
        alt: "Shwerni Free Sessions - الجلسات المجانية",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني - الجلسات المجانية | Free Sessions - Shwerni",
    description:
      "احجز جلسة مجانية مع مستشار الآن عبر شاورني. Free session booking with a consultant via Shwerni.",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}other/freesession.png`,
        alt: "Shwerni Free Sessions - الجلسات المجانية",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: `${mainRoute}favicon.ico`,
};

// default
export default async function FreeSession() {
  // user
  // const user = await userServer();

  // check if the day is monday
  // const targetDay = isFirstWeekdayOfMonth(nowDate, 5);

  // is target day
  // if (!targetDay) return <NotToday day={5} label="الجلسات المجانية" />;

  // owners
  // const owners = (await getAllFreeSessionOwners(date, time)) ?? [];

  // if not exist
  // if (!owners) return <WrongPage />;

  // return
  return (
    <UnavailableService
      title="جلسة التعريفية المجانية"
      header="جرّب شاورني مجانًا"
      description="ابدأ جلستك التعريفية المجانية مع أحد مستشارينا لتتعرف على المنصة وتكتشف كيف يمكننا دعمك، دون أي التزام مالي."
      day={Weekday.FRIDAY}
    />
  );
}
