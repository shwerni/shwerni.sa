// React & Next
import { NextResponse } from "next/server";

// prisma
import prisma from "@/lib/database/db";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { subDays, subMinutes, format } from "date-fns";

// data
import { checkReschedule } from "@/data/reschedule";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

// max possible meeting duration in minutes — adjust if sessions can be longer
const MAX_DURATION_MINUTES = 60;

// buffer after meeting ends before sending notification (minutes)
const BUFFER_MINUTES = 10;

export async function GET(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const { iso: now, date: today } = timeZone();

    // yesterday as yyyy-MM-dd string
    const yesterday = subDays(now, 1).toISOString().slice(0, 10);

    // prisma pre-filter ceiling for today — see loop for exact per-meeting check
    const preCutoffTime = format(
      subMinutes(now, MAX_DURATION_MINUTES + BUFFER_MINUTES),
      "HH:mm",
    );

    // fetch candidate meetings
    const meetings = await prisma.meeting.findMany({
      where: {
        done: false,
        checked: false,
        OR: [
          // yesterday — always past threshold regardless of duration
          { date: yesterday },
          // today — pre-filter with max possible duration ceiling
          {
            date: today,
            time: { lte: preCutoffTime },
          },
        ],
      },
      select: {
        mid: true,
        time: true,
        date: true,
        duration: true,
      },
    });

    // no meetings to process
    if (!meetings.length) return NextResponse.json({ notified: [], count: 0 });

    // exact per-meeting threshold filter (Prisma pre-filter over-fetches intentionally)
    const due = meetings.filter((meeting) => {
      const [hours, minutes] = meeting.time.split(":").map(Number);
      const meetingStart = new Date(`${meeting.date}T00:00:00`);
      meetingStart.setHours(hours, minutes, 0, 0);

      const durationMinutes = Number(meeting.duration) || 60;
      const threshold = new Date(
        meetingStart.getTime() + (durationMinutes + BUFFER_MINUTES) * 60_000,
      );

      return now >= threshold;
    });

    // no meetings past threshold
    if (!due.length) return NextResponse.json({ notified: [], count: 0 });

    // fire all notifications concurrently — allSettled never throws
    const results = await Promise.allSettled(
      due.map((meeting) => checkReschedule(meeting.mid)),
    );

    // bucket results by outcome
    const notified: string[] = [];
    const failed: { mid: string; reason: string }[] = [];

    results.forEach((result, i) => {
      if (result.status === "fulfilled") {
        notified.push(due[i].mid);
      } else {
        failed.push({
          mid: due[i].mid,
          reason: result.reason?.message ?? "unknown",
        });
      }
    });

    return NextResponse.json({
      notified,
      count: notified.length,
      ...(failed.length && { failed, failedCount: failed.length }),
    });
  } catch {
    return NextResponse.json(
      { error: "failed - could not process meetings" },
      { status: 500 },
    );
  }
}
