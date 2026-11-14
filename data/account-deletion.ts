import "server-only";

// packages
import { createHash, randomInt, timingSafeEqual } from "node:crypto";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// lib
import { rateLimit } from "@/lib/rate-limit";
import { notificationSecurityOtp } from "@/lib/notifications/site";

// utils
import { randomId } from "@/utils/random";

// constants
import {
  DELETED_USER_LABEL,
  DELETION_BLOCKERS,
  DELETION_CODE_LENGTH,
  DELETION_CODE_MAX_TRIES,
  DELETION_CODE_SENDS,
  DELETION_CODE_TTL_SECONDS,
  DELETION_CODE_WINDOW,
  type DeletionBlockerCode,
} from "@/constants/account";

export type DeletionBlocker = { code: DeletionBlockerCode; message: string };

// the deletion code's row in better auth's verification table (MobileVerification)
const codeIdentifier = (userId: string) => `account-delete:${userId}`;
const hashCode = (userId: string, code: string) =>
  createHash("sha256").update(`${userId}:${code}`).digest("hex");

// only a client (role USER) can delete their own account; consultants and staff go through support
export async function canSelfDelete(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, deletedAt: true, _count: { select: { Consultant: true } } },
  });
  return !!user && !user.deletedAt && user.role === UserRole.USER && user._count.Consultant === 0;
}

/**
 * what stops the deletion now: a PAID order with a meeting that hasn't ended, or with sessions not
 * booked yet (a package), and a wallet balance. checked on check, code and delete
 */
export async function deletionBlockers(userId: string): Promise<DeletionBlocker[]> {
  const [[sessions], wallet] = await Promise.all([
    prisma.$queryRaw<{ upcoming: boolean }[]>`
      SELECT EXISTS (
        SELECT 1
        FROM orders o
        JOIN payments p ON p."orderId" = o.oid
        WHERE o.author = ${userId}
          AND p.payment = ${PaymentState.PAID}::"PaymentState"
          AND (
            -- a meeting not done whose end (riyadh date + time + duration) is still ahead
            EXISTS (
              SELECT 1 FROM meetings m
              WHERE m."orderId" = o.oid
                AND m.done = false
                AND m.date ~ '^\\d{4}-\\d{2}-\\d{2}$'
                AND m.time ~ '^\\d{2}:\\d{2}$'
                AND ((m.date || ' ' || m.time)::timestamp AT TIME ZONE 'Asia/Riyadh')
                    + make_interval(mins => COALESCE(NULLIF(regexp_replace(m.duration, '\\D', '', 'g'), '')::int, 60))
                    > now()
            )
            -- sessions of a package (or a program) still to be booked
            OR o."sessionCount" > (SELECT count(*) FROM meetings m WHERE m."orderId" = o.oid)
          )
      ) AS upcoming
    `,
    prisma.wallet.findUnique({ where: { userId }, select: { credit: true } }),
  ]);

  const blockers: DeletionBlocker[] = [];
  if (sessions?.upcoming) {
    blockers.push({ code: "upcoming_sessions", message: DELETION_BLOCKERS.upcoming_sessions });
  }
  if ((wallet?.credit ?? 0) > 0) {
    blockers.push({ code: "wallet_balance", message: DELETION_BLOCKERS.wallet_balance });
  }
  return blockers;
}

/**
 * a new deletion code to the account's own phone (the sign-in codes' whatsapp template), stored
 * hashed in better auth's verification table; earlier codes stop working
 * @returns the masked phone, or "rate_limited" (more than 3 sends in 10 minutes) / "no_phone"
 */
export async function sendDeletionCode(
  userId: string,
): Promise<{ sentTo: string } | "rate_limited" | "no_phone"> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, name: true },
  });
  if (!user?.phone) return "no_phone";

  if (
    !(await rateLimit(`account-delete:${userId}`, {
      limit: DELETION_CODE_SENDS,
      window: DELETION_CODE_WINDOW,
    }))
  ) {
    return "rate_limited";
  }

  const code = String(randomInt(0, 10 ** DELETION_CODE_LENGTH)).padStart(DELETION_CODE_LENGTH, "0");
  const identifier = codeIdentifier(userId);
  await prisma.$transaction([
    prisma.mobileVerification.deleteMany({ where: { identifier } }),
    prisma.mobileVerification.create({
      data: {
        identifier,
        // the hash and the wrong tries so far
        value: `${hashCode(userId, code)}:0`,
        expiresAt: new Date(Date.now() + DELETION_CODE_TTL_SECONDS * 1000),
      },
    }),
  ]);

  await notificationSecurityOtp(user.phone, user.name ?? "", code);
  return { sentTo: `•••• ${user.phone.slice(-4)}` };
}

/**
 * is this the account's current deletion code? a wrong code counts a try; after
 * DELETION_CODE_MAX_TRIES (or once expired) the code is gone. consume: a right code is used up
 * (the deletion); without it the code stays for the deletion step (the website's check)
 */
async function matchDeletionCode(userId: string, code: string, consume: boolean): Promise<boolean> {
  const identifier = codeIdentifier(userId);
  const row = await prisma.mobileVerification.findFirst({
    where: { identifier },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return false;

  if (row.expiresAt <= new Date()) {
    await prisma.mobileVerification.deleteMany({ where: { identifier } });
    return false;
  }

  const [stored, triesText] = row.value.split(":");
  const given = Buffer.from(hashCode(userId, code));
  const match =
    !!stored && stored.length === given.length && timingSafeEqual(Buffer.from(stored), given);

  if (match) {
    if (consume) await prisma.mobileVerification.deleteMany({ where: { identifier } });
    return true;
  }

  const tries = Number(triesText ?? 0) + 1;
  if (tries >= DELETION_CODE_MAX_TRIES) {
    await prisma.mobileVerification.deleteMany({ where: { identifier } });
  } else {
    await prisma.mobileVerification.update({
      where: { id: row.id },
      data: { value: `${stored}:${tries}` },
    });
  }
  return false;
}

// the deletion step: a right code is used up
export const consumeDeletionCode = (userId: string, code: string) =>
  matchDeletionCode(userId, code, true);

// the website's check step (signed out): a right code proves the phone and stays for the deletion
export const verifyDeletionCode = (userId: string, code: string) =>
  matchDeletionCode(userId, code, false);

// a live (not deleted) account by its phone, for the website's signed-out flow
export async function liveUserIdByPhone(phone: string): Promise<string | null> {
  // the website sends digits only; an account may hold the same number with a leading +
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  const user = await prisma.user.findFirst({
    where: { phone: { in: [digits, `+${digits}`] }, deletedAt: null },
    select: { id: true },
  });
  return user?.id ?? null;
}

/**
 * delete = anonymize, never a hard delete, in one transaction (the user's decisions, 2026-11-11):
 * - the user row stays: name → DELETED_USER_LABEL, phone / email / image / password → null, deletedAt
 * - like the orders (name, phone → DELETED_USER_LABEL): the user's orders and their guest rows,
 *   pleadings, free sessions, pre-consultations, bank transfer requests
 * - public names → DELETED_USER_LABEL: reviews, article comments, questions
 * - the client's meeting links (participant tokens) are replaced, so old links stop working
 * - access ends: website (next-auth) and app (better auth) accounts and sessions, push and voip
 *   tokens and pending codes are removed (credentials, not records)
 * - kept as they are: every other record (payments, invoices, chats, wallet, favorites,
 *   notifications), signed pleading documents, daftra clients, the blocked list, whatsapp bot rows
 */
export async function anonymizeAccount(userId: string): Promise<void> {
  const label = DELETED_USER_LABEL;

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.findUniqueOrThrow({
      where: { id: userId },
      select: { phone: true },
    });

    await tx.user.update({
      where: { id: userId },
      data: {
        name: label,
        phone: null,
        email: null,
        image: null,
        password: null,
        phoneVerified: null,
        emailVerified: null,
        deletedAt: new Date(),
      },
    });

    // records like the orders
    await tx.order.updateMany({ where: { author: userId }, data: { name: label, phone: label } });
    await tx.guest.updateMany({
      where: { order: { author: userId } },
      data: { name: label, phone: label },
    });
    await tx.pleading.updateMany({ where: { author: userId }, data: { name: label, phone: label } });
    await tx.freeSession.updateMany({ where: { author: userId }, data: { name: label, phone: label } });
    await tx.preConsultation.updateMany({
      where: { author: userId },
      data: { name: label, phone: label },
    });
    await tx.bankTransferRequest.updateMany({
      where: { author: userId },
      data: { clientName: label, clientPhone: label },
    });

    // public names
    await tx.review.updateMany({ where: { author: userId }, data: { name: label } });
    await tx.articleComment.updateMany({
      where: { OR: [{ userId }, { author: userId }] },
      data: { name: label },
    });
    await tx.question.updateMany({ where: { userId }, data: { name: label } });

    // the client's meeting links
    const participants = await tx.participant.findMany({
      where: { role: UserRole.USER, meeting: { orders: { author: userId } } },
      select: { id: true },
    });
    // one statement for all of them (a loop of updates could outlast the transaction's timeout)
    if (participants.length > 0) {
      const ids = participants.map((participant) => participant.id);
      const tokens = ids.map(() => randomId());
      await tx.$executeRaw`
        UPDATE participants p
        SET participant = t.token
        FROM unnest(${ids}::text[], ${tokens}::text[]) AS t(id, token)
        WHERE p.id = t.id
      `;
    }

    // access ends
    await tx.account.deleteMany({ where: { userId } });
    await tx.mobileAccount.deleteMany({ where: { userId } });
    await tx.mobileSession.deleteMany({ where: { userId } });
    await tx.pushToken.deleteMany({ where: { userId } });
    await tx.voipPushToken.deleteMany({ where: { userId } });
    await tx.mobileVerification.deleteMany({
      where: {
        identifier: { in: [codeIdentifier(userId), ...(user.phone ? [user.phone] : [])] },
      },
    });
    if (user.phone) await tx.verificationToken.deleteMany({ where: { phone: user.phone } });
  },
  // about 20 statements over the network: more room than prisma's 5 second default, all or nothing
  { maxWait: 10_000, timeout: 30_000 });
}
