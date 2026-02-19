// React & Next
import { Metadata } from "next";

// components
import Instant from "@/components/clients/instant";

// lib
import { timeZone } from "@/lib/site/time";

// hook
import { userServer } from "@/lib/auth/server";

// constants
import { mainRoute } from "@/constants/links";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - حجز فوري",
  description:
    "حجز استشارة نفسية فورية مع مختصين معتمدين عبر شاورني. احجز الآن بسرية تامة وابدأ رحلة التوازن النفسي في دقائق من أي مكان.",
  keywords: [
    "المستشارون",
    "المستشارين",
    "حجز فوري",
    "مستشارين",
    "مشتشار",
    "شاورني",
    "shwerni",
    "مستشار نفسي",
    "مستشار أسري",
    "علاج نفسي",
    "therapy",
  ],
  openGraph: {
    title: "shwerni instant - شاورني حجز فوري",
    type: "website",
    url: `${mainRoute}/instant`,
    siteName: "شاورني",
    description:
      "حجز استشارة نفسية فورية مع مختصين معتمدين عبر شاورني. احجز الآن بسرية تامة وابدأ رحلة التوازن النفسي في دقائق من أي مكان.",
    images: [
      {
        url: `${mainRoute}other/instant.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "شاورني - حجز فوري",
    description:
      "حجز استشارة نفسية فورية مع مختصين معتمدين عبر شاورني. احجز الآن بسرية تامة وابدأ رحلة التوازن النفسي في دقائق من أي مكان.",
    creator: "@shwernisa",
    images: [
      {
        url: `${mainRoute}other/instant.jpeg`,
        alt: "shwerni",
        type: "image/jpg",
        width: 1200,
        height: 630,
      },
    ],
  },
  icons: `${mainRoute}favicon.ico`,
};

const Page = async () => {
  // user
  const user = await userServer();

  // time
  const { time, date } = timeZone();

  // return
  return <Instant date={date} time={time} user={user} />;
};

export default Page;
