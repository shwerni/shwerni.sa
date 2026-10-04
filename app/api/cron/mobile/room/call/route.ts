// packages
import { addMinutes, parse } from "date-fns";
import { NextResponse } from "next/server";

// utils
import prisma from "@/lib/database/db";
import { timeZone } from "@/utils/date";
import { ringParticipant } from "@/lib/api/room/ring-participant";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/client";

// lib
import { isCronRequest } from "@/lib/api/routes/cron-auth";

const DATE_FORMAT = "yyyy-MM-dd HH:mm";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) => isCronRequest(req);

// meeting shape shared by both queries below
const meetingSelect = {
  mid: true,
  date: true,
  time: true,
  orders: {
    select: {
      author: true,
      name: true,
      payment: { select: { payment: true } },
      consultant: { select: { userId: true, name: true, image: true } },
    },
  },
} as const;

async function dispatchRings() {
  const { date, time } = timeZone();
  const now = parse(`${date} ${time}`, DATE_FORMAT, new Date());

  const candidates = await prisma.meeting.findMany({
    where: { date, ringedAt: null, blocked: false, done: false },
    select: meetingSelect,
  });

  let rung = 0;

  for (const meeting of candidates) {
    if (meeting.orders?.payment?.payment !== PaymentState.PAID) continue;

    const start = parse(
      `${meeting.date} ${meeting.time}`,
      DATE_FORMAT,
      new Date(),
    );
    if (now < start) continue;

    const client = {
      id: meeting.orders.author,
      name: meeting.orders.name,
      image: null,
    };
    // center consultants have no user, so there is no one to ring
    const consultantUserId = meeting.orders.consultant.userId;
    if (!consultantUserId) continue;

    const consultant = {
      id: consultantUserId,
      name: meeting.orders.consultant.name,
      image: meeting.orders.consultant.image,
    };

    await Promise.all([
      ringParticipant(meeting.mid, client.id, consultant, false),
      ringParticipant(meeting.mid, consultant.id, client, false),
    ]);

    await prisma.meeting.update({
      where: { mid: meeting.mid },
      data: { ringedAt: new Date() },
    });
    rung++;
  }

  return rung;
}

async function dispatchRecalls() {
  const { date, time } = timeZone();
  const now = parse(`${date} ${time}`, DATE_FORMAT, new Date());

  const candidates = await prisma.meeting.findMany({
    where: {
      date,
      recalledAt: null,
      ringedAt: { not: null },
      blocked: false,
      done: false,
    },
    select: meetingSelect,
  });

  let recalled = 0;

  for (const meeting of candidates) {
    if (meeting.orders?.payment?.payment !== PaymentState.PAID) continue;

    const start = parse(
      `${meeting.date} ${meeting.time}`,
      DATE_FORMAT,
      new Date(),
    );
    if (now < addMinutes(start, 5)) continue;

    const client = {
      id: meeting.orders.author,
      name: meeting.orders.name,
      image: null,
    };
    // center consultants have no user, so there is no one to ring
    const consultantUserId = meeting.orders.consultant.userId;
    if (!consultantUserId) continue;

    const consultant = {
      id: consultantUserId,
      name: meeting.orders.consultant.name,
      image: meeting.orders.consultant.image,
    };

    // "never joined at all" — no session row, checked independent of
    // whether a Participant row exists (one may exist from the initial
    // ring's presence check without ever actually connecting)
    const [clientJoined, consultantJoined] = await Promise.all([
      prisma.participant.findUnique({
        where: {
          meetingId_participant: {
            meetingId: meeting.mid,
            participant: client.id,
          },
        },
        select: { logs: { take: 1 } },
      }),
      prisma.participant.findUnique({
        where: {
          meetingId_participant: {
            meetingId: meeting.mid,
            participant: consultant.id,
          },
        },
        select: { logs: { take: 1 } },
      }),
    ]);

    const jobs: Promise<unknown>[] = [];
    if (!clientJoined || clientJoined.logs.length === 0) {
      jobs.push(ringParticipant(meeting.mid, client.id, consultant, true));
    }
    if (!consultantJoined || consultantJoined.logs.length === 0) {
      jobs.push(ringParticipant(meeting.mid, consultant.id, client, true));
    }

    await Promise.all(jobs);

    await prisma.meeting.update({
      where: { mid: meeting.mid },
      data: { recalledAt: new Date() },
    });
    recalled++;
  }

  return recalled;
}

// shared by both GET (vercel cron always invokes via GET) and POST
// (manual testing), same pattern as your existing notification dispatch
async function dispatchMeetingRings(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const rung = await dispatchRings();
  const recalled = await dispatchRecalls();

  return NextResponse.json({ rung, recalled });
}

export const GET = dispatchMeetingRings;
export const POST = dispatchMeetingRings;
