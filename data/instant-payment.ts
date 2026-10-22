import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  OrderType,
  PaymentState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// lib
import { getRealtimeOnlineIds } from "@/lib/api/realtime/internal";
import { telegramAdmin } from "@/lib/api/telegram/telegram";

// utils
import { dateTimeToString } from "@/utils/date";
import { ONLINE_LISTABLE, consultantBusyBetween } from "./online-busy";

// constants
import {
  INSTANT_DURATION,
  INSTANT_LOCK_NS,
  INSTANT_PAYMENT_WINDOW_MS,
  INSTANT_WINDOW_PASSED_NOTE,
} from "@/constants/instant";

// what the check reads from the order orderStatusPaid already loaded
type InstantPaidOrder = {
  oid: number;
  consultantId: number;
  consultant: { name: string | null; userId: string | null } | null;
  meeting: { date: string; time: string; duration: string }[];
};

const windowSeconds = INSTANT_PAYMENT_WINDOW_MS / 1000;
const note = (text: string) =>
  `${text} | modified_at: ${dateTimeToString(new Date())}`;

/**
 * an INSTANT payment that was just claimed PAID (orderStatusPaid, never the dashboard): is the
 * consultant still free for it? under the same pg_advisory_xact_lock as booking, so a payment and
 * a booking (or two payments) for one consultant run one at a time. every payment: no other PAID,
 * not done meeting overlapping this one. a late payment (the order had already left NEW /
 * PROCESSING: its window passed and it went to HOLD, or the client booked again and it was
 * CANCELED): also listable, online on the realtime server, and no other client's instant order
 * inside its payment window. not free: HOLD (with paidAt: it was paid) inside the same lock, then
 * a telegram alert. returns true when the payment was put on HOLD. any error also holds it
 */
export async function holdInstantPaymentIfTaken(
  order: InstantPaidOrder,
  paymentId: string,
  before: PaymentState,
): Promise<boolean> {
  const late = before !== PaymentState.NEW && before !== PaymentState.PROCESSING;
  const userId = order.consultant?.userId ?? null;

  let reason: string | null;
  try {
    // live presence, read before the lock (no network inside the transaction), late payments only
    const onlineIds = late
      ? await getRealtimeOnlineIds().catch(() => null)
      : null;

    // this order's own session
    const meeting = order.meeting[0];
    const startsAt = new Date(`${meeting.date}T${meeting.time}:00+03:00`);
    const minutes = Number(meeting.duration) || INSTANT_DURATION;
    const endsAt = new Date(startsAt.getTime() + minutes * 60_000 - 1);

    reason = await prisma.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(${INSTANT_LOCK_NS}::int, ${order.consultantId}::int)`;

      const [row] = await tx.$queryRaw<
        { taken: boolean; listable: boolean; openOther: boolean }[]
      >`
        SELECT
          ${consultantBusyBetween(startsAt, endsAt, { exceptOid: order.oid })} AS taken,
          (${ONLINE_LISTABLE}) AS listable,
          EXISTS (
            SELECT 1 FROM orders o
            JOIN payments p ON p."orderId" = o.oid
            WHERE o."consultantId" = c.cid
              AND o.oid <> ${order.oid}
              AND o.type = ${OrderType.INSTANT}::"OrderType"
              AND p.payment IN (${PaymentState.NEW}::"PaymentState", ${PaymentState.PROCESSING}::"PaymentState")
              AND o.created_at > now() - make_interval(secs => ${windowSeconds}::double precision)
          ) AS "openOther"
        FROM consultants c
        WHERE c.cid = ${order.consultantId}
      `;

      let found: string | null = null;
      if (!row) found = "the consultant wasn't found";
      else if (row.taken) found = "the consultant has another paid session at that time";
      else if (late && !row.listable) found = "the consultant isn't listable any more";
      else if (late && onlineIds === null) found = "the realtime server couldn't be reached";
      else if (late && (!userId || !onlineIds?.includes(userId)))
        found = "the consultant went offline";
      else if (late && row.openOther)
        found = "another client is paying for the same consultant";

      if (found) await holdPayment(tx, order.oid, paymentId, before, found);
      return found;
    });
  } catch (err) {
    // the check itself failed: a person looks at it rather than a meeting nobody checked
    reason = `the check failed: ${err instanceof Error ? err.message : String(err)}`;
    await holdPayment(prisma, order.oid, paymentId, before, reason).catch((e) =>
      console.error(`[instant] oid=${order.oid} hold failed:`, e),
    );
  }

  if (!reason) return false;

  console.error(`[instant] oid=${order.oid} paid, put on HOLD: ${reason}`);
  await telegramAdmin(
    `instant: order #${order.oid} paid (was ${before}), put on HOLD: ${reason}. consultant ${
      order.consultant?.name ?? "-"
    } (${userId ?? "no user"}). no meeting was created: refund or rebook by hand`,
  );
  return true;
}

type Runner = Pick<typeof prisma, "$executeRaw">;

// HOLD with paidAt (it was paid, so the cancel cron never cancels it) and an info note
async function holdPayment(
  runner: Runner,
  oid: number,
  paymentId: string,
  before: PaymentState,
  reason: string,
) {
  await runner.$executeRaw`
    UPDATE payments
    SET payment = ${PaymentState.HOLD}::"PaymentState", "paidAt" = COALESCE("paidAt", now())
    WHERE id = ${paymentId}
  `;
  await runner.$executeRaw`
    UPDATE orders
    SET info = array_append(info, ${note(`instant: paid (was ${before}) but put on HOLD: ${reason}`)})
    WHERE oid = ${oid}
  `;
}

// the cancel cron: instant orders still NEW / PROCESSING past their payment window → HOLD, the
// same rule as a booking. returns how many
export async function holdStaleInstantOrders(): Promise<number> {
  return prisma.$executeRaw`
    WITH held AS (
      UPDATE payments p
      SET payment = ${PaymentState.HOLD}::"PaymentState"
      FROM orders o
      WHERE p."orderId" = o.oid
        AND o.type = ${OrderType.INSTANT}::"OrderType"
        AND p.payment IN (${PaymentState.NEW}::"PaymentState", ${PaymentState.PROCESSING}::"PaymentState")
        AND o.created_at <= now() - make_interval(secs => ${windowSeconds}::double precision)
      RETURNING p."orderId"
    )
    UPDATE orders SET info = array_append(info, ${note(INSTANT_WINDOW_PASSED_NOTE)})
    WHERE oid IN (SELECT "orderId" FROM held)
  `;
}

// the cancel cron: instant orders put on HOLD for a passed payment window and never paid
// (paidAt empty), created before `deadline` → CANCELED. a payment arriving later is still checked
// by holdInstantPaymentIfTaken. returns how many
export async function cancelUnpaidHeldInstantOrders(
  deadline: Date,
): Promise<number> {
  return prisma.$executeRaw`
    WITH cancelled AS (
      UPDATE payments p
      SET payment = ${PaymentState.CANCELED}::"PaymentState", cancelled_at = now()
      FROM orders o
      WHERE p."orderId" = o.oid
        AND o.type = ${OrderType.INSTANT}::"OrderType"
        AND p.payment = ${PaymentState.HOLD}::"PaymentState"
        AND p."paidAt" IS NULL
        AND o.created_at <= ${deadline}
        AND EXISTS (
          SELECT 1 FROM unnest(o.info) AS i WHERE i LIKE ${`${INSTANT_WINDOW_PASSED_NOTE}%`}
        )
      RETURNING p."orderId"
    )
    UPDATE orders SET info = array_append(info, ${note("instant: cancelled, never paid after its payment window")})
    WHERE oid IN (SELECT "orderId" FROM cancelled)
  `;
}

// ---------- the success page's landing ----------

export type InstantLanding =
  | { kind: "meeting"; mid: string; participant: string }
  | { kind: "review" };

type LandingState = {
  payment: PaymentState | null;
  mid: string | null;
  participant: string | null;
};

// an instant order's payment state and the client's meeting participant (created with the room
// by onPaymentSuccess, just after the PAID claim: PAID alone doesn't mean the room is ready)
export async function readInstantLanding(oid: number): Promise<LandingState> {
  const order = await prisma.order.findUnique({
    where: { oid },
    select: {
      payment: { select: { payment: true } },
      meeting: {
        orderBy: { session: "asc" },
        take: 1,
        select: {
          mid: true,
          participants: {
            where: { role: UserRole.USER },
            take: 1,
            select: { participant: true },
          },
        },
      },
    },
  });
  const meeting = order?.meeting[0];
  return {
    payment: order?.payment?.payment ?? null,
    mid: meeting?.mid ?? null,
    participant: meeting?.participants[0]?.participant ?? null,
  };
}

const defaultSleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * where the success page sends an INSTANT order. the gateway's confirmation may still be on its
 * way when the client lands, so it re-reads for up to timeoutMs: PAID with the client's
 * participant (the room is ready) → the meeting; NEW, PROCESSING, or PAID without the room yet →
 * wait; HOLD or any other state → the review message at once; still not final at the end → the
 * review message. never a meeting link for an order that isn't PAID with its room
 */
export async function waitForInstantLanding(
  oid: number,
  {
    timeoutMs = 10_000,
    intervalMs = 1_000,
    read = readInstantLanding,
    sleep = defaultSleep,
    now = Date.now,
  }: {
    timeoutMs?: number;
    intervalMs?: number;
    read?: (oid: number) => Promise<LandingState>;
    sleep?: (ms: number) => Promise<void>;
    now?: () => number;
  } = {},
): Promise<InstantLanding> {
  const deadline = now() + timeoutMs;

  for (;;) {
    const state = await read(oid);
    if (state.payment === PaymentState.PAID && state.mid && state.participant)
      return { kind: "meeting", mid: state.mid, participant: state.participant };

    const pending =
      state.payment === PaymentState.NEW ||
      state.payment === PaymentState.PROCESSING ||
      state.payment === PaymentState.PAID;
    if (!pending || now() + intervalMs > deadline) return { kind: "review" };

    await sleep(intervalMs);
  }
}
