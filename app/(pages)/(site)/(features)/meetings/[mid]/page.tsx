// React & Next
import { Metadata } from "next";
import { redirect } from "next/navigation";

// components
import Meetings from "@/components/clients/meetings";
import Error404 from "@/components/shared/error-404";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// lib
import { timeZone } from "@/utils/date";

// utils
import { getMeetingForPage } from "@/data/meetings";
import { mainRoute } from "@/constants/links";
import { withCallbackUrl } from "@/utils/callback-url";

// handlers
import { meetingViewer } from "@/handlers/meetings/meeting-access";

// meta data seo
const ogImage = {
  url: `${mainRoute}meta/session.jpeg`,
  alt: "شاورني",
  type: "image/jpeg",
  width: 1200,
  height: 630,
};

const title = "شاورني - الجلسة";
const description =
  "انضم إلى جلستك الاستشارية عبر شاورني بسرية تامة ومن أي مكان.";

export const metadata: Metadata = {
  title,
  description,
  robots: { index: false, follow: false },
  openGraph: {
    title,
    description,
    type: "website",
    url: `${mainRoute}meeting`,
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

// props
type Props = {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{
    participant?: string;
  }>;
};

// return
export default async function Page({ params, searchParams }: Props) {
  // zid
  const { mid } = await params;

  // the link's token: the client's own (no login), or an old consultant link (ignored: the
  // consultant is his login and the order, never a token)
  const { participant } = await searchParams;

  // who opens the page (the standing rule, CLAUDE.md)
  const viewer = await meetingViewer(mid, participant, "meetings-page");

  // the consultant path with no session: log in, then back here (no token in the callback)
  if (viewer === "login") redirect(withCallbackUrl("/login", `/meetings/${mid}`));

  // validate
  if (!viewer) return <Error404 />;

  // get consultant
  const meeting = await getMeetingForPage(mid);

  // validate
  if (!meeting) return <Error404 />;

  // validate
  if (meeting?.orders?.payment?.payment !== PaymentState.PAID)
    return <Error404 />;

  // time and date
  const { date, time } = timeZone();

  // return
  return (
    <Meetings
      mid={mid}
      order={meeting.orders}
      time={time}
      date={date}
      meeting={meeting}
      viewer={viewer}
    />
  );
}
