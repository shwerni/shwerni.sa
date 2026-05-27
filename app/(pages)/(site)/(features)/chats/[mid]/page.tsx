// React & Next
import { notFound } from "next/navigation";

// componenets
import ChatClient from "@/components/clients/chats/chat";

// prisma data
import { getChatMeeting } from "@/data/chats";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

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

  // current participant
  const currentParticipant = meeting.participants.find(
    (p) => p.participant === participantId,
  );

  // validate
  if (!currentParticipant) notFound();

  // consultant
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
      }}
      participantId={participantId}
      senderRole={currentParticipant.role}
    />
  );
}
