import "server-only";

// packages
import { z } from "zod";

// prisma data
import { ensureMeetingParticipant } from "@/data/rooms";
import { isBookableSlot } from "@/data/booking/slots";
import { checkMeetingTimeConflict } from "@/data/order/reserveation";
import { bookPickedMeeting, finishPickedSession, getOrderForNextSession } from "@/data/sessions";

// prisma types
import { PaymentState, SessionType, UserRole } from "@/lib/generated/prisma/enums";

export type PickNextSessionResult =
  | { ok: true; mid: string; participant: string }
  | { ok: false; error: "invalid" | "slot_taken"; message: string };

const SLOT_TAKEN = "هذا الموعد غير متاح، برجاء اختيار وقت آخر";
const INVALID = "حدث خطأ ما";

const PickSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
});

/**
 * the client picks the next session of a package / program order (/sessions/{id}). the access is
 * the link (clients never log in, CLAUDE.md); everything else is decided here, never by the browser:
 * - the order is MULTIPLE and PAID
 * - the session number is the next one (its meetings so far + 1, at most sessionCount)
 * - the duration is the first session's (45 for packages, the program's for programs)
 * - the slot is one the page lists (isBookableSlot: the weekly timings, the 7-day window from
 *   riyadh now + 25 minutes, free under freeSlotWhere) and conflicts with nothing
 *   (checkMeetingTimeConflict, with no own-order exception: the package's own sessions block too)
 * the answer carries only the client's own participant token, never the consultant's
 * @param oid the order (from the page, which opened it from the link)
 * @param input the picked date (yyyy-MM-dd, riyadh) and time (HH:mm); anything else is ignored
 */
export async function pickNextSession(
  oid: number,
  input: { date: unknown; time: unknown },
): Promise<PickNextSessionResult> {
  const invalid = { ok: false, error: "invalid", message: INVALID } as const;

  const parsed = PickSchema.safeParse(input);
  if (!Number.isInteger(oid) || oid <= 0 || !parsed.success) return invalid;
  const { date, time } = parsed.data;

  const order = await getOrderForNextSession(oid);
  if (
    !order ||
    order.session !== SessionType.MULTIPLE ||
    order.payment?.payment !== PaymentState.PAID
  ) {
    return invalid;
  }

  const first = order.meeting[0];
  const session = order.meeting.length + 1;
  if (!first || session > order.sessionCount) return invalid;

  if (
    !(await isBookableSlot(order.consultantId, date, time)) ||
    (await checkMeetingTimeConflict(order.consultantId, time, date))
  ) {
    return { ok: false, error: "slot_taken", message: SLOT_TAKEN };
  }

  try {
    // the same checks again under the consultant's booking lock, with the create (one transaction)
    const meeting = await bookPickedMeeting(order, session, date, time, first.duration);
    if (!meeting) return { ok: false, error: "slot_taken", message: SLOT_TAKEN };

    const mid = await finishPickedSession(order, meeting);
    const participant = await ensureMeetingParticipant(mid, UserRole.USER);
    return { ok: true, mid, participant };
  } catch (err) {
    // a second pick of the same session number (orderId + session is unique) lands here too
    console.error(`[sessions] oid=${oid} session=${session} pick failed`, err);
    return invalid;
  }
}
