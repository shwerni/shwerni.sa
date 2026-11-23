// React & Next
import { notFound, redirect } from "next/navigation";

// components
import ChatClient from "@/components/clients/chats/list/chat";

// prisma data
import { getChatMeeting } from "@/data/chats";

// handlers
import { meetingViewer } from "@/handlers/meetings/meeting-access";

// utils
import { withCallbackUrl } from "@/utils/callback-url";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

interface PageProps {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{ back?: string }>;
}

// only a path on this site: anything else falls back to the chat list
const safeBack = (back: string | undefined) =>
  back && back.startsWith("/") && !back.startsWith("//") && !back.includes("\\")
    ? back
    : "/dashboard/chats";

export default async function MeetingChatPage({
  params,
  searchParams,
}: PageProps) {
  const { mid } = await params;
  const { back } = await searchParams;

  // back defaults to the chat list for whichever dashboard linked here
  const backHref = safeBack(back);

  // the consultant of this order, by his login (never a token from the url: ?participant= is
  // ignored). his participant token comes from the database after that check
  const viewer = await meetingViewer(mid, undefined, "dashboard-chats");
  if (viewer === "login") redirect(withCallbackUrl("/login", `/dashboard/chats/${mid}`));
  if (!viewer || viewer.side !== "consultant") notFound();

  const meeting = await getChatMeeting(mid);

  if (!meeting) notFound();
  if (meeting.orders.payment?.payment !== PaymentState.PAID) notFound();

  const consultant = meeting.orders.consultant;

  return (
    <ChatClient
      mid={mid}
      session={meeting.session}
      date={meeting.date}
      username={meeting.orders.name}
      time={meeting.time}
      orderOid={meeting.orders.oid}
      consultant={{
        cid: consultant.cid,
        name: consultant.name,
        image: consultant.image,
        gender: consultant.gender,
        centerSlug: consultant.center?.slug ?? null,
      }}
      participantId={viewer.participant}
      senderRole={viewer.role}
      backHref={backHref}
    />
  );
}
