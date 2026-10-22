import "server-only";

// React & Next
import { after } from "next/server";

// prisma data
import { setConsultantOffline } from "@/data/online";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { INTERNAL_SECRET_HEADER } from "@/lib/auth/internal-secret";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// utils
import { meetingUrl } from "@/utils";

// constants
import { mainRoute } from "@/constants/links";
import { INSTANT_DURATION } from "@/constants/instant";

// the realtime server answers in milliseconds; a payment never waits longer than this for it
const TIMEOUT_MS = 3_000;

// what onPaymentSuccess has: the order with its consultant and its meeting (room created)
type BusyOrder = {
  oid: number;
  consultant: { name: string | null; userId: string | null } | null;
  meeting?: {
    mid: string;
    date: string;
    time: string;
    duration: string;
    participants?: { role: UserRole; participant: string }[];
  }[];
};

// POST /internal/consultant-busy's body: the instant-booked event plus whose it is
export type ConsultantBusyPayload = {
  consultantId: string;
  orderId: number;
  meetingId: string;
  meetingUrl: string;
  startsAt: string;
  duration: number;
  busyUntil: number;
};

/**
 * the busy call's body, or null when there's nothing to do: a center consultant (no user), no
 * meeting, or a meeting that has already ended (a late mark-as-paid). the meeting keeps riyadh
 * wall-clock strings, so its start is read with +03:00; busyUntil = start + duration. meetingUrl
 * is the consultant's own link (the owner participant), the one the whatsapp button sends
 */
export function consultantBusyPayload(
  order: BusyOrder,
  now: number = Date.now(),
): ConsultantBusyPayload | null {
  const userId = order.consultant?.userId;
  const meeting = order.meeting?.[0];
  if (!userId || !meeting) return null;

  const startsAt = Date.parse(`${meeting.date}T${meeting.time}:00+03:00`);
  if (!Number.isFinite(startsAt)) return null;
  const duration = Number(meeting.duration) || INSTANT_DURATION;
  const busyUntil = startsAt + duration * 60_000;
  if (busyUntil <= now) return null;

  const owner = meeting.participants?.find((p) => p.role === UserRole.OWNER);

  return {
    consultantId: userId,
    orderId: order.oid,
    meetingId: meeting.mid,
    meetingUrl: owner
      ? meetingUrl(meeting.mid, owner.participant)
      : `${mainRoute}meetings/${meeting.mid}`,
    startsAt: new Date(startsAt).toISOString(),
    duration,
    busyUntil,
  };
}

/**
 * the consultant goes offline until the meeting ends: the database first, then the realtime
 * server (every socket of his offline, instant-booked to him, consultant-online refused until
 * busyUntil). any failure (the database, a timeout, the network, a 4xx or 5xx) alerts the admin.
 * never throws
 */
export async function markConsultantBusy(order: BusyOrder): Promise<void> {
  const payload = consultantBusyPayload(order);
  if (!payload) return;

  const failures: string[] = [];

  try {
    await setConsultantOffline(payload.consultantId);
  } catch (err) {
    failures.push(`database: ${err instanceof Error ? err.message : String(err)}`);
  }

  try {
    const res = await fetch(`${process.env.BACKEND_URL}/internal/consultant-busy`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [INTERNAL_SECRET_HEADER]: process.env.INTERNAL_SHARED_SECRET ?? "",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      failures.push(`realtime server ${res.status}${text ? `: ${text.slice(0, 200)}` : ""}`);
    }
  } catch (err) {
    const timedOut = err instanceof Error && err.name === "TimeoutError";
    failures.push(
      timedOut
        ? `realtime server: no answer in ${TIMEOUT_MS / 1000}s`
        : `realtime server: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  if (failures.length === 0) return;

  const reason = failures.join("; ");
  console.error(`[instant] oid=${order.oid} consultant busy failed: ${reason}`);
  await telegramAdmin(
    `instant busy failed: order #${order.oid}, consultant ${
      order.consultant?.name ?? "-"
    } (${payload.consultantId}): ${reason}. the consultant may still show online`,
  ).catch(() => {});
}

// after the response (next's after(), like lib/daftra/auto.ts), so it never delays the payment;
// outside a request scope it runs in the background. never throws into the caller
export function scheduleConsultantBusy(order: BusyOrder): void {
  const task = () => markConsultantBusy(order).catch(() => {});
  try {
    after(task);
  } catch {
    void task();
  }
}
