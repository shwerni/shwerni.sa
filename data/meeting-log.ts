import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  type MeetingLogAction,
  type MeetingLogSource,
  UserRole,
} from "@/lib/generated/prisma/enums";
import type { Prisma } from "@/lib/generated/prisma/client";

// who did it: the session user (web session or mobile session), never client input.
// null for customers on public links, and for crons and webhooks
export type MeetingLogActor = {
  id: string;
  name?: string | null;
  role?: string | null;
} | null;

// one meeting_logs line (spec: the dashboard repo's SHIFTS.md §4)
export type MeetingLogInput = {
  meetingId: string | null;
  orderId: number;
  session?: number | null;
  action: MeetingLogAction;
  source: MeetingLogSource;
  actor?: MeetingLogActor;
  // only the fields that changed
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
};

// the keys of `after` whose value differs from `before`, as { before, after } holding just those
export const changedFields = (
  before: Record<string, unknown>,
  after: Record<string, unknown>,
) => {
  const keys = Object.keys(after).filter(
    (key) => JSON.stringify(before[key]) !== JSON.stringify(after[key]),
  );
  return {
    changed: keys.length > 0,
    before: Object.fromEntries(keys.map((key) => [key, before[key] ?? null])),
    after: Object.fromEntries(keys.map((key) => [key, after[key] ?? null])),
  };
};

// a role string from a session is stored only when it is a real UserRole
const asRole = (role?: string | null) =>
  role && (Object.values(UserRole) as string[]).includes(role)
    ? (role as UserRole)
    : null;

// append one line to meeting_logs. it never throws: a failed log is printed and dropped, so it
// can't fail or roll back the booking, payment, webhook or customer action that called it.
// callers run it after their change has succeeded, outside any transaction
export async function writeMeetingLog(input: MeetingLogInput): Promise<void> {
  try {
    await prisma.meetingLog.create({
      data: {
        meetingId: input.meetingId,
        orderId: input.orderId,
        session: input.session ?? null,
        action: input.action,
        source: input.source,
        actorId: input.actor?.id ?? null,
        actorName: input.actor?.name ?? null,
        actorRole: asRole(input.actor?.role),
        ...(input.before
          ? { before: input.before as Prisma.InputJsonValue }
          : {}),
        ...(input.after ? { after: input.after as Prisma.InputJsonValue } : {}),
      },
    });
  } catch (error) {
    console.error(
      "[meeting-log] write failed:",
      input.action,
      input.meetingId ?? `order ${input.orderId}`,
      error,
    );
  }
}

// CREATED for the first meeting of a new site booking (checkout, program, instant): the
// customer made it, so no actor. it never throws
export async function logBookedMeeting(order: {
  oid: number;
  meeting: {
    mid: string;
    session: number;
    date: string;
    time: string;
    duration: string;
  }[];
}): Promise<void> {
  const meeting = order.meeting[0];
  if (!meeting) return;

  await writeMeetingLog({
    meetingId: meeting.mid,
    orderId: order.oid,
    session: meeting.session,
    action: "CREATED",
    source: "SITE",
    before: null,
    after: {
      date: meeting.date,
      time: meeting.time,
      duration: meeting.duration,
      session: meeting.session,
    },
  });
}
