// React & Next
import { notFound, redirect } from "next/navigation";

// componenets
import ChatClient from "@/components/clients/chats/chat";

// prisma data
import { getChatMeeting } from "@/data/chats";

// handlers
import { meetingViewer } from "@/handlers/meetings/meeting-access";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";
import UploadThingWrapper from "@/components/wrappers/uploadthing";

// props
interface Props {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{ participant?: string }>;
}

export default async function MeetingChatPage({ params, searchParams }: Props) {
  // mid
  const { mid } = await params;

  // participant id
  const participantId = (await searchParams).participant ?? "";

  // get meeting
  const meeting = await getChatMeeting(mid);

  // validate
  if (!meeting) notFound();

  // validate
  if (meeting.orders.payment?.payment !== PaymentState.PAID) notFound();

  // who opens the chat: a client by their own token (no login); the consultant only by his
  // login, on his dashboard chat (an old link with his token, or none, goes there)
  const viewer = await meetingViewer(mid, participantId || undefined, "chats-page");

  // validate
  if (!viewer) notFound();

  // consultant
  const consultant = meeting.orders.consultant;

  // the consultant's side lives on the dashboard (the proxy asks for the login and comes back).
  // a consultant with no account can't log in: his token keeps this page (logged in meetingViewer)
  if (viewer === "login" || (viewer.side === "consultant" && consultant.userId)) {
    redirect(`/dashboard/chats/${mid}`);
  }

  return (
    <UploadThingWrapper>
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
      />
    </UploadThingWrapper>
  );
}
