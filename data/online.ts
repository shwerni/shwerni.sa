"use server";
import prisma from "@/lib/database/db";
import { pusherServer } from "@/lib/api/pusher/pusher-server";
import {
  ApprovalState,
  Categories,
  Gender,
  OnlineStatus,
  OrderOrigin,
  OrderType,
  PaymentState,
  ReviewState,
  UserRole,
} from "@/lib/generated/prisma/enums";
import { InstantFormType, instantSchema } from "@/schemas";
import { checkMeetingTimeConflict } from "./order/reserveation";
import { dateToString } from "@/utils/time";
import { orderInfoLabel } from "@/utils";
import { ConsultantCard } from "@/types/layout";
import { ReserveResult } from "@/types/admin";

const BUSY_SUBQUERY = `
  EXISTS (
    SELECT 1 FROM orders o
    JOIN payments p ON p."orderId" = o."oid"
    JOIN meetings m ON m."orderId" = o."oid"
    WHERE o."consultantId" = c."cid"
      AND p."payment" IN ('NEW', 'PROCESSING', 'PAID')
      AND m."done" = false
      AND m."date" = TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'YYYY-MM-DD')
      AND m."time" >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh' - INTERVAL '30 minutes', 'HH24:MI')
      AND m."time" <= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'HH24:MI')
  )
`;

// ─── Types ───────────────────────────────────────────────────────────────────

type OnlineConsultant = {
  userId: string;
  cid: number;
  name: string;
  image: string | null;
  gender: Gender;
  category: Categories;
  rate: number;
  cost30: number;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function checkIsAnyConsultantOnline(): Promise<boolean> {
  // Also excludes busy consultants — consistent with the list
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*) as count FROM consultants c
    WHERE c."online_status" = 'ONLINE'
    AND c."statusA" = 'PUBLISHED'
    AND c."approved" = 'APPROVED'
    AND c."status" = true
    AND NOT ${BUSY_SUBQUERY}
  `);
  return Number(result[0]?.count ?? 0) > 0;
}

export async function getOnlineConsultantsList(): Promise<OnlineConsultant[]> {
  return prisma.$queryRawUnsafe<OnlineConsultant[]>(`
    SELECT c."userId", c."cid", c."name", c."image", c."gender", c."category", c."rate", c."cost30"
    FROM consultants c
    WHERE c."online_status" = 'ONLINE'
    AND c."statusA" = 'PUBLISHED'
    AND c."approved" = 'APPROVED'
    AND c."status" = true
    AND NOT ${BUSY_SUBQUERY}
  `);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getAvailableCount(): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*) as count FROM consultants c
    WHERE c."online_status" = 'ONLINE'
    AND c."statusA" = 'PUBLISHED'
    AND c."approved" = 'APPROVED'
    AND c."status" = true
    AND NOT ${BUSY_SUBQUERY}
  `);
  return Number(result[0]?.count ?? 0);
}

async function trigger(
  userId: string,
  isOnline: boolean,
  consultant: OnlineConsultant,
) {
  const onlineCount = await getAvailableCount();
  await pusherServer.trigger("public-consultant-status", "status-changed", {
    userId,
    isOnline,
    consultant,
    anyOnline: onlineCount > 0,
    onlineCount,
  });
}

// ─── Webhook handler ─────────────────────────────────────────────────────────

export async function handlePresenceWebhook(userId: string, isOnline: boolean) {
  // Run update + fetch in parallel
  const [, consultant] = await Promise.all([
    prisma.consultant.update({
      where: { userId },
      data: {
        online_status: isOnline ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE,
        online_at: isOnline ? new Date() : null,
      },
      select: { userId: true },
    }),
    prisma.consultant.findUnique({
      where: { userId },
      select: {
        userId: true,
        cid: true,
        name: true,
        image: true,
        gender: true,
        rate: true,
        category: true,
        cost30: true,
      },
    }),
  ]);

  if (!consultant) return;

  // If going online, check if they're currently busy in a meeting
  let isAvailable = isOnline;
  if (isOnline) {
    const busy = await prisma.$queryRawUnsafe<unknown[]>(`
      SELECT 1 FROM orders o
      JOIN payments p ON p."orderId" = o."oid"
      JOIN meetings m ON m."orderId" = o."oid"
      WHERE o."consultantId" = ${consultant.cid}
        AND p."payment" IN ('NEW', 'PROCESSING', 'PAID')
        AND m."done" = false
        AND m."date" = TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'YYYY-MM-DD')
        AND m."time" >= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh' - INTERVAL '30 minutes', 'HH24:MI')
        AND m."time" <= TO_CHAR(NOW() AT TIME ZONE 'Asia/Riyadh', 'HH24:MI')
      LIMIT 1
    `);
    isAvailable = busy.length === 0;
  }

  await trigger(userId, isAvailable, consultant);
}

export async function broadcastConsultantBusy(userId: string) {
  const consultant = await prisma.consultant.findUnique({
    where: { userId },
    select: {
      userId: true,
      cid: true,
      name: true,
      image: true,
      gender: true,
      rate: true,
      category: true,
      cost30: true,
    },
  });

  if (!consultant) return;

  // isOnline: false removes them from every client list immediately
  await trigger(userId, false, consultant);
}

// reserve a new order (meeting) with owner
export const reserveInstant = async (
  formdata: InstantFormType,
  total: number,
  origin: OrderOrigin = OrderOrigin.PLATFORM,
) => {
  try {
    // parse
    const parsed = instantSchema.safeParse(formdata);

    // validate
    if (!parsed.success) {
      return {
        state: false,
        code: "info",
        message: "بيانات النموذج غير صالحة، برجاء مراجعتها والمحاولة مرة أخرى",
      } satisfies ReserveResult<never>;
    }

    // data
    const data = parsed.data;

    // check time conflict
    const conflict = await checkMeetingTimeConflict(
      data.cid,
      data.time,
      dateToString(data.date),
    );

    // validate
    if (conflict)
      return {
        state: false,
        code: "info",
        message: `هذا الموعد (${dateToString(data.date)} - ${data.time}) تم حجزه بالفعل، برجاء اختيار وقت آخر`,
      } satisfies ReserveResult<never>;

    // get owner data
    const owner = await prisma.consultant.findFirst({
      where: { cid: data.cid },
      select: { name: true, commission: true },
    });

    // if owner not exist
    if (!owner || !owner.name)
      return {
        state: false,
        code: "error",
        message: "هذا المستشار غير متاح حالياً",
      } satisfies ReserveResult<never>;

    // onwer name & commission
    const { name, commission } = owner;

    // order commission if owner dont have specific commission set the default
    const oCommission = commission ? commission : data?.finance.commission;

    // create new reservation
    const order = await prisma.order.create({
      data: {
        origin,
        author: data.user,
        consultantId: data.cid,
        name: data.name,
        phone: data.phone,
        type: OrderType.INSTANT,
        meeting: {
          create: {
            session: 1,
            date: dateToString(data.date),
            time: data.time,
            duration: String(data.duration),
          },
        },
        payment: {
          create: {
            total,
            commission: oCommission,
            tax: data.finance.tax,
            payment: PaymentState.NEW,
          },
        },
        info: [
          orderInfoLabel(
            null,
            "new",
            PaymentState.NEW,
            total,
            data.finance.tax,
            oCommission,
            name,
            data.cid,
          ),
        ],
      },
      include: {
        payment: true,
        meeting: {
          include: { participants: true },
        },
        consultant: {
          select: { name: true, userId: true, phone: true },
        },
      },
    });

    if (data.notes && data.notes.trim().length > 0)
      await prisma.orderMessage.create({
        data: {
          content: data.notes.trim(),
          sender: UserRole.USER,
          orderId: order.oid,
          meetingId: order.meeting[0].mid,
        },
      });

    // deactivate online state
    await broadcastConsultantBusy(order.consultant.userId);

    // return
    return { state: true, order } satisfies ReserveResult<typeof order>;
  } catch (err) {
    console.error("reserveInstant:", err);
    return {
      state: false,
      code: "error",
      message: "حدث خطأ أثناء إنشاء الطلب، برجاء المحاولة مرة أخرى",
    } satisfies ReserveResult<never>;
  }
};

// export async function handlePresenceWebhook(userId: string, isOnline: boolean) {
//   await prisma.consultant.update({
//     where: { userId },
//     data: {
//       online_status: isOnline ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE,
//       online_at: isOnline ? new Date() : null,
//     },
//     select: { userId: true },
//   });

//   const consultant = await prisma.consultant.findUnique({
//     where: { userId },
//     select: {
//       userId: true,
//       cid: true,
//       name: true,
//       image: true,
//       gender: true,
//       rate: true,
//       category: true,
//       cost30: true,
//     },
//   });

//   const onlineCount = await prisma.consultant.count({
//     where: { online_status: OnlineStatus.ONLINE },
//   });

//   await pusherServer.trigger("public-consultant-status", "status-changed", {
//     userId,
//     isOnline,
//     consultant,
//     anyOnline: onlineCount > 0,
//     onlineCount,
//   });
// }

// sets a consultant online in the db, called right before the socket
// emits consultant-online so the two stay in sync
export async function setConsultantOnline(userId: string) {
  await prisma.consultant.update({
    where: { userId },
    data: { online_status: OnlineStatus.ONLINE, online_at: new Date() },
  });
}

// sets a consultant offline, called on manual toggle or via the
// internal reconcile route when a connection drops unexpectedly
export async function setConsultantOffline(userId: string) {
  await prisma.consultant.update({
    where: { userId },
    data: { online_status: OnlineStatus.OFFLINE },
  });
}

// full profile data for consultants currently online, keyed by the
// live id list nest already holds in memory
export async function getConsultantsOnline(
  userIds: string[],
  filters: { search?: string; categories?: string[]; gender?: string } = {},
) {
  if (userIds.length === 0) return [];

  try {
    const consultants = await prisma.$queryRaw<ConsultantCard[]>`
      SELECT
        c.cid,
        c."userId",
        c.name,
        c.title,
        c.image,
        c.category,
        c.rate,
        c.gender,
        c.created_at,
        c."cost30",
        (
          SELECT COUNT(*)
          FROM "reviews" r
          WHERE r."consultantId" = c.cid AND r.status = ${ReviewState.PUBLISHED}::"ReviewState"
        ) AS reviews,
        GREATEST(DATE_PART('year', AGE(NOW(), c.seniority))::int, 1) AS years,
        COALESCE(
          (SELECT ARRAY_AGG(s.name) FROM "consultant_specialties" cs
           JOIN "specialties" s ON s.id = cs."specialtyId"
           WHERE cs."consultantId" = c.cid),
          ARRAY[]::text[]
        ) AS specialties

      FROM "consultants" c
      WHERE
        c."userId" = ANY(${userIds}::text[])
        AND c.status = true
        AND c.approved = ${ApprovalState.APPROVED}::"ApprovalState"
        AND (${filters.categories?.length ?? 0} = 0 OR c.category = ANY(${filters.categories ?? []}::"Categories"[]))
        AND (${filters.gender ?? null}::text IS NULL OR c.gender = ${filters.gender ?? null}::"Gender")
        AND (${filters.search ?? null}::text IS NULL OR c.name ILIKE '%' || ${filters.search ?? null} || '%' OR c.title ILIKE '%' || ${filters.search ?? null} || '%')

      ORDER BY c.rate DESC;
    `;

    return consultants;
  } catch {
    return [];
  }
}
