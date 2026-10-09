import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Prisma } from "@/lib/generated/prisma/client";
import {
  ApprovalState,
  Categories,
  ConsultantState,
  PaymentState,
  PleadingState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// lib
import { checkMessageWithAI } from "@/lib/api/ai/chat-guard";
import { newClientToken } from "@/lib/pleading-token";
import { fail, ok, type ActionResult } from "@/lib/safe-action";
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import {
  notificationPleadingChatMessage,
  notificationPleadingNewRequest,
  notificationPleadingQuoted,
  notificationPleadingRequestReceived,
} from "@/lib/notifications/site";

// utils
import { withTax } from "@/utils/tax";
import {
  isPleadingChatOpen,
  PLEADING_OPEN_STATES,
  PLEADING_TTL_DAYS,
  pleadingDeclineMessage,
  pleadingQuoteMessage,
  type PleadingError,
  type PleadingFile,
} from "@/utils/pleading";

// the client token is a credential: it's never selected into a returned object, never put in
// a log line, and never sent to the consultant. it's read only to build the client's own link

const DAY_MS = 86_400_000;

// a NEW order younger than this is a checkout still running (the cancel-orders cron cancels
// NEW orders after 20 minutes)
const CHECKOUT_WINDOW_MS = 20 * 60_000;

type Result<T> = Promise<ActionResult<T, PleadingError>>;

// who is asking: the client by their link token, or the consultant by their session
export type ClientBy = { token: string };
export type OwnerBy = { plid: number; userId: string };
type AccessBy = ClientBy | OwnerBy;

// what every access path loads (no token, no phone)
const caseSelect = {
  id: true,
  plid: true,
  state: true,
  name: true,
  price: true,
  requestedAt: true,
  quotedAt: true,
  expiresAt: true,
  created_at: true,
  consultantId: true,
} satisfies Prisma.PleadingSelect;

export type PleadingCase = Prisma.PleadingGetPayload<{
  select: typeof caseSelect;
}>;

export type PleadingAccess = {
  pleading: PleadingCase;
  role: typeof UserRole.USER | typeof UserRole.OWNER;
};

// the same message fields the meeting chat returns, so the chat bubbles render them as is
const messageSelect = {
  id: true,
  content: true,
  sender: true,
  fileUrl: true,
  fileType: true,
  fileName: true,
  createdAt: true,
  blocked: true,
} satisfies Prisma.OrderMessageSelect;

// a consultant who can receive pleading requests: public, LAW, opted in
const pleadingConsultantWhere = (cid: number) =>
  ({
    cid,
    status: true,
    statusA: ConsultantState.PUBLISHED,
    approved: ApprovalState.APPROVED,
    centerId: null,
    category: Categories.LAW,
    pleadingEnabled: true,
  }) satisfies Prisma.ConsultantWhereInput;

// errors are logged by name or prisma code only: a prisma message can echo query values
const logError = (fn: string, err: unknown, plid?: number) => {
  const code =
    err instanceof Prisma.PrismaClientKnownRequestError
      ? err.code
      : err instanceof Error
        ? err.name
        : "error";
  console.error(`[pleading] ${fn} failed${plid ? ` plid=${plid}` : ""} ${code}`);
};

// ---------- expiry ----------

// persists the expiry of every due case matching `where`: a quote past expiresAt, or a request
// with no quote 7 days after it was submitted. runs before every read that shows a state, so a
// case shows EXPIRED even if nobody opened it. no notification
export async function expireDuePleadings(
  where: Prisma.PleadingWhereInput = {},
) {
  const now = new Date();
  const requestDeadline = new Date(now.getTime() - PLEADING_TTL_DAYS * DAY_MS);

  try {
    await prisma.pleading.updateMany({
      where: {
        AND: [
          where,
          {
            OR: [
              { state: PleadingState.QUOTED, expiresAt: { lt: now } },
              {
                state: PleadingState.REQUESTED,
                requestedAt: { lt: requestDeadline },
              },
            ],
          },
        ],
      },
      data: { state: PleadingState.EXPIRED },
    });
  } catch (err) {
    logError("expire", err);
  }
}

// ---------- access ----------

// the case and the caller's role, or null for "not found or not yours" (the same answer).
// the client reaches any state of their own case, DRAFT included; the consultant never sees a DRAFT
export async function getPleadingAccess(
  by: AccessBy,
): Promise<PleadingAccess | null> {
  try {
    if ("token" in by) {
      await expireDuePleadings({ clientToken: by.token });
      const pleading = await prisma.pleading.findUnique({
        where: { clientToken: by.token },
        select: caseSelect,
      });
      return pleading ? { pleading, role: UserRole.USER } : null;
    }

    await expireDuePleadings({ plid: by.plid });
    const pleading = await prisma.pleading.findFirst({
      where: {
        plid: by.plid,
        state: { not: PleadingState.DRAFT },
        consultant: { userId: by.userId },
      },
      select: caseSelect,
    });
    return pleading ? { pleading, role: UserRole.OWNER } : null;
  } catch (err) {
    logError("access", err, "plid" in by ? by.plid : undefined);
    return null;
  }
}

// the client's case page: the case and its consultant
export async function getClientPleading(token: string) {
  try {
    await expireDuePleadings({ clientToken: token });
    return await prisma.pleading.findUnique({
      where: { clientToken: token },
      select: {
        ...caseSelect,
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
    });
  } catch (err) {
    logError("client", err);
    return null;
  }
}

// the consultant's case page (ownership by the session user, never a cid from the client)
export async function getPleadingForConsultant(plid: number, userId: string) {
  return (await getPleadingAccess({ plid, userId }))?.pleading ?? null;
}

// the consultant's case list, newest request first, with the last message and the number of
// client messages (counted the same way as the chat list)
export async function listConsultantPleadings(userId: string) {
  try {
    await expireDuePleadings({ consultant: { userId } });

    const rows = await prisma.pleading.findMany({
      where: {
        consultant: { userId },
        state: { not: PleadingState.DRAFT },
      },
      orderBy: { requestedAt: "desc" },
      select: {
        plid: true,
        state: true,
        name: true,
        price: true,
        requestedAt: true,
        quotedAt: true,
        expiresAt: true,
        messages: {
          where: { blocked: false },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: {
            content: true,
            fileType: true,
            createdAt: true,
            sender: true,
          },
        },
        _count: {
          select: { messages: { where: { sender: UserRole.USER } } },
        },
      },
    });

    return rows.map(({ messages, _count, ...pleading }) => ({
      ...pleading,
      lastMessage: messages[0] ?? null,
      clientMessages: _count.messages,
    }));
  } catch (err) {
    logError("list", err);
    return null;
  }
}

// the case chat, oldest first
export async function getPleadingThread(pleadingId: string) {
  try {
    return await prisma.orderMessage.findMany({
      where: { pleadingId },
      orderBy: { createdAt: "asc" },
      select: messageSelect,
    });
  } catch (err) {
    logError("thread", err);
    return null;
  }
}

// the request page's consultant: only one who can receive pleading requests
export async function getPleadingConsultant(cid: number) {
  try {
    return await prisma.consultant.findFirst({
      where: pleadingConsultantWhere(cid),
      select: { cid: true, name: true, title: true, image: true, gender: true },
    });
  } catch (err) {
    logError("consultant", err);
    return null;
  }
}

// the case's current checkout order: "paid", "running" (NEW and under 20 minutes old, or a
// payment PROCESSING or on HOLD, e.g. tabby), or null when there's none or it's abandoned
export async function getPleadingCheckout(
  pleadingId: string,
): Promise<"paid" | "running" | null> {
  const pleading = await prisma.pleading.findUnique({
    where: { id: pleadingId },
    select: {
      order: {
        select: { created_at: true, payment: { select: { payment: true } } },
      },
    },
  });

  const order = pleading?.order;
  if (!order) return null;

  const payment = order.payment?.payment;
  if (payment === PaymentState.PAID) return "paid";
  if (
    payment === PaymentState.PROCESSING ||
    payment === PaymentState.HOLD ||
    (payment === PaymentState.NEW &&
      Date.now() - order.created_at.getTime() < CHECKOUT_WINDOW_MS)
  )
    return "running";

  return null;
}

// ---------- request ----------

// step 1: a DRAFT case with the brief as its first client message. the token goes back to
// the client only (their identity for the case); the consultant sees nothing until finalize
export async function createPleadingDraft(input: {
  cid: number;
  name: string;
  phone: string;
  brief: string;
  author: string | null;
}): Result<{ plid: number; token: string }> {
  try {
    const consultant = await prisma.consultant.findFirst({
      where: pleadingConsultantWhere(input.cid),
      select: { cid: true },
    });
    if (!consultant) return fail("unavailable");

    if (await checkMessageWithAI(input.brief)) return fail("contact_info");

    const token = newClientToken();
    const pleading = await prisma.pleading.create({
      data: {
        consultantId: consultant.cid,
        name: input.name,
        phone: input.phone,
        author: input.author,
        clientToken: token,
        messages: {
          create: { content: input.brief, sender: UserRole.USER },
        },
      },
      select: { plid: true },
    });

    return ok({ plid: pleading.plid, token });
  } catch (err) {
    logError("draft", err);
    return fail("server_error");
  }
}

// step 2: the uploaded files become client messages after the brief, the case becomes
// REQUESTED, and both sides are notified
export async function finalizePleadingDraft(
  token: string,
  files: PleadingFile[],
): Result<{ plid: number }> {
  try {
    const draft = await prisma.pleading.findUnique({
      where: { clientToken: token },
      select: {
        id: true,
        plid: true,
        state: true,
        name: true,
        phone: true,
        consultantId: true,
      },
    });
    if (!draft) return fail("not_found");
    if (draft.state !== PleadingState.DRAFT) return fail("invalid_state");

    // the consultant may have opted out since step 1
    const consultant = await prisma.consultant.findFirst({
      where: pleadingConsultantWhere(draft.consultantId),
      select: { name: true, phone: true },
    });
    if (!consultant) return fail("unavailable");

    const submitted = await prisma.$transaction(async (tx) => {
      const { count } = await tx.pleading.updateMany({
        where: { id: draft.id, state: PleadingState.DRAFT },
        data: { state: PleadingState.REQUESTED, requestedAt: new Date() },
      });
      if (!count) return false;

      if (files.length)
        await tx.orderMessage.createMany({
          data: files.map((file) => ({
            pleadingId: draft.id,
            sender: UserRole.USER,
            content: "",
            fileUrl: file.url,
            fileType: file.type,
            fileName: file.name,
          })),
        });

      return true;
    });
    if (!submitted) return fail("invalid_state");

    await notificationPleadingNewRequest(
      consultant.phone,
      consultant.name,
      draft.plid,
      draft.name,
    );
    await notificationPleadingRequestReceived(
      draft.phone,
      draft.name,
      draft.plid,
      consultant.name,
      token,
    );

    return ok({ plid: draft.plid });
  } catch (err) {
    logError("finalize", err);
    return fail("server_error");
  }
}

// ---------- chat ----------

// a case chat message from either side. the sender is the access path's role (token = USER,
// owner session = OWNER), never input. the same ai contact-info guard as the meeting chat,
// and the same rule: the sender's first message of the day notifies the other side
export async function sendPleadingMessage(
  by: AccessBy,
  message: { content: string; file?: PleadingFile | null },
): Result<{ id: string }> {
  const access = await getPleadingAccess(by);
  if (!access) return fail("not_found");

  const { pleading, role } = access;

  try {
    if (!isPleadingChatOpen(pleading.state)) return fail("closed");

    const content = message.content.trim();
    const file = message.file ?? null;
    if (!content && !file) return fail("empty_message");

    if (content && (await checkMessageWithAI(content)))
      return fail("contact_info");

    // today (server midnight, as in the meeting chat)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const hasToday = await prisma.orderMessage.findFirst({
      where: {
        pleadingId: pleading.id,
        sender: role,
        createdAt: { gte: startOfToday },
      },
      select: { id: true },
    });

    const created = await prisma.orderMessage.create({
      data: {
        pleadingId: pleading.id,
        sender: role,
        content,
        fileUrl: file?.url ?? null,
        fileType: file?.type ?? null,
        fileName: file?.name ?? null,
      },
      select: { id: true },
    });

    if (!hasToday) await notifyPleadingChat(pleading.id, role);

    return ok({ id: created.id });
  } catch (err) {
    logError("message", err, pleading.plid);
    return fail("server_error");
  }
}

// the other side of the case chat: the consultant gets the dashboard link, the client their own link
async function notifyPleadingChat(pleadingId: string, sender: UserRole) {
  const pleading = await prisma.pleading.findUnique({
    where: { id: pleadingId },
    select: {
      plid: true,
      name: true,
      phone: true,
      clientToken: true,
      consultant: { select: { name: true, phone: true } },
    },
  });
  if (!pleading) return;

  const { plid, name, phone, clientToken, consultant } = pleading;

  if (sender === UserRole.USER)
    await notificationPleadingChatMessage(
      consultant.phone,
      consultant.name,
      name,
      plid,
      `dashboard/pleadings/${plid}`,
    );
  else
    await notificationPleadingChatMessage(
      phone,
      name,
      consultant.name,
      plid,
      `pleading/q/${clientToken}`,
    );
}

// ---------- consultant decisions ----------

// the quote: the reply and a pre-vat price, posted in the case chat. a re-quote while QUOTED
// replaces the price and restarts the 7 days. refused while a checkout of the old quote runs
export async function quotePleading(
  by: OwnerBy,
  quote: { reply: string; price: number },
): Result<null> {
  const access = await getPleadingAccess(by);
  if (!access || access.role !== UserRole.OWNER) return fail("not_found");

  const { pleading } = access;

  try {
    if (!isPleadingChatOpen(pleading.state)) return fail("invalid_state");

    const checkout = await getPleadingCheckout(pleading.id);
    if (checkout === "paid") return fail("invalid_state");
    if (checkout === "running") return fail("checkout_in_progress");

    // the consultant's own text; the price line is written by the server
    if (await checkMessageWithAI(quote.reply)) return fail("contact_info");

    const quotedAt = new Date();
    const expiresAt = new Date(quotedAt.getTime() + PLEADING_TTL_DAYS * DAY_MS);

    const quoted = await prisma.$transaction(async (tx) => {
      const { count } = await tx.pleading.updateMany({
        where: { id: pleading.id, state: { in: PLEADING_OPEN_STATES } },
        data: {
          state: PleadingState.QUOTED,
          price: quote.price,
          quotedAt,
          expiresAt,
        },
      });
      if (!count) return false;

      await tx.orderMessage.create({
        data: {
          pleadingId: pleading.id,
          sender: UserRole.OWNER,
          content: pleadingQuoteMessage(quote.price, quote.reply),
        },
      });

      return true;
    });
    if (!quoted) return fail("invalid_state");

    await notifyPleadingQuoted(pleading.id, quote.price, expiresAt);

    return ok(null);
  } catch (err) {
    logError("quote", err, pleading.plid);
    return fail("server_error");
  }
}

// the client: the vat-inclusive price they'll be charged, and the expiry day in riyadh
async function notifyPleadingQuoted(
  pleadingId: string,
  price: number,
  expiresAt: Date,
) {
  const pleading = await prisma.pleading.findUnique({
    where: { id: pleadingId },
    select: {
      plid: true,
      name: true,
      phone: true,
      clientToken: true,
      consultant: { select: { name: true } },
    },
  });
  if (!pleading) return;

  await notificationPleadingQuoted(
    pleading.phone,
    pleading.name,
    pleading.consultant.name,
    pleading.plid,
    withTax(price),
    expiresAt.toLocaleDateString("en-CA", { timeZone: "Asia/Riyadh" }),
    pleading.clientToken,
  );
}

// closes an open case as DECLINED (the consultant) or CANCELED (the client), posting `message`
// in the case chat in the same transaction when given. refused while a checkout runs, so a
// payment can't land on a closed case
async function closePleading(
  access: PleadingAccess,
  state: typeof PleadingState.DECLINED | typeof PleadingState.CANCELED,
  message?: { sender: UserRole; content: string },
): Result<null> {
  const { pleading } = access;

  try {
    if (!isPleadingChatOpen(pleading.state)) return fail("invalid_state");

    const checkout = await getPleadingCheckout(pleading.id);
    if (checkout === "paid") return fail("invalid_state");
    if (checkout === "running") return fail("checkout_in_progress");

    const closed = await prisma.$transaction(async (tx) => {
      const { count } = await tx.pleading.updateMany({
        where: { id: pleading.id, state: { in: PLEADING_OPEN_STATES } },
        data: { state },
      });
      if (!count) return false;

      if (message)
        await tx.orderMessage.create({
          data: { pleadingId: pleading.id, ...message },
        });

      return true;
    });
    if (!closed) return fail("invalid_state");

    return ok(null);
  } catch (err) {
    logError("close", err, pleading.plid);
    return fail("server_error");
  }
}

// the consultant declines: an OWNER message with the optional reason (guarded like any
// message), and the client is always told, outside the first-of-the-day rule
export async function declinePleading(
  by: OwnerBy,
  reason?: string | null,
): Result<null> {
  const access = await getPleadingAccess(by);
  if (!access || access.role !== UserRole.OWNER) return fail("not_found");

  const text = reason?.trim() ?? "";

  try {
    if (text && (await checkMessageWithAI(text))) return fail("contact_info");
  } catch (err) {
    logError("decline", err, access.pleading.plid);
    return fail("server_error");
  }

  const result = await closePleading(access, PleadingState.DECLINED, {
    sender: UserRole.OWNER,
    content: pleadingDeclineMessage(text),
  });

  if (result.ok) await notifyPleadingChat(access.pleading.id, UserRole.OWNER);

  return result;
}

export async function cancelPleading(by: ClientBy): Result<null> {
  const access = await getPleadingAccess(by);
  if (!access || access.role !== UserRole.USER) return fail("not_found");
  return closePleading(access, PleadingState.CANCELED);
}

// ---------- payment ----------

// NOT CALLED YET: wired into onPaymentSuccess in phase 6, with approval. in one transaction, marks
// the case of this order PAID and moves its whole chat onto the session's meeting, so the
// session chat continues the same thread. QUOTED or EXPIRED pass (a quote can expire while its
// checkout is still running); PAID passes again, so a repeated call is harmless. a payment that
// lands on a DECLINED or CANCELED case isn't linked: it's logged and sent to the admin telegram
// for a manual refund. null when the order isn't a case's current checkout or wasn't linked;
// never throws, so onPaymentSuccess goes on as for any order
export async function linkPaidPleading(
  oid: number,
  mid: string,
): Promise<{ plid: number } | null> {
  try {
    const pleading = await prisma.pleading.findUnique({
      where: { orderId: oid },
      select: { id: true, plid: true, state: true },
    });
    if (!pleading) return null;

    if (
      pleading.state === PleadingState.DECLINED ||
      pleading.state === PleadingState.CANCELED
    ) {
      console.error(
        `[pleading] paid order on a closed case oid=${oid} plid=${pleading.plid} state=${pleading.state}`,
      );
      await telegramAdmin(
        `pleading: order #${oid} was paid but case #${pleading.plid} is ${pleading.state}, not linked. refund manually`,
      );
      return null;
    }

    return await prisma.$transaction(async (tx) => {
      const { count } = await tx.pleading.updateMany({
        where: {
          id: pleading.id,
          orderId: oid,
          state: {
            in: [
              PleadingState.QUOTED,
              PleadingState.EXPIRED,
              PleadingState.PAID,
            ],
          },
        },
        data: { state: PleadingState.PAID },
      });
      if (!count) return null;

      await tx.orderMessage.updateMany({
        where: { pleadingId: pleading.id },
        data: { orderId: oid, meetingId: mid },
      });

      return { plid: pleading.plid };
    });
  } catch (err) {
    logError("link", err);
    return null;
  }
}
