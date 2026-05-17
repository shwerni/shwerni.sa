import { notFound } from "next/navigation";
import { PaymentState } from "@/lib/generated/prisma/enums";
import prisma from "@/lib/database/db";
import ChatClient from "@/components/clients/chats/chat";

interface PageProps {
  params: Promise<{ mid: string }>;
  searchParams: Promise<{ participant?: string }>;
}

export default async function MeetingChatPage({
  params,
  searchParams,
}: PageProps) {
  const { mid } = await params;
  const participantId = (await searchParams).participant ?? "";

  const meeting = await prisma.meeting.findUnique({
    where: { mid },
    include: {
      participants: true,
      orders: {
        include: {
          payment: {
            select: { payment: true },
          },
          consultant: {
            select: {
              cid: true,
              name: true,
              title: true,
              image: true,
              gender: true,
            },
          },
        },
      },
    },
  });

  if (!meeting) notFound();

  if (meeting.orders.payment?.payment !== PaymentState.PAID) notFound();

  const currentParticipant = meeting.participants.find(
    (p) => p.participant === participantId,
  );
  if (!currentParticipant) notFound();

  // ── Shape props for client ────────────────────────────────────────────────
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
