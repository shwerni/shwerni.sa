"use server";
import prisma from "@/lib/database/db";
import { pusherServer } from "@/lib/api/pusher/pusher-server";
import {
  Categories,
  Gender,
  OnlineStatus,
  OrderType,
  PaymentState,
} from "@/lib/generated/prisma/enums";
import { InstantFormType, instantSchema } from "@/schemas";
import { checkMeetingTimeConflict } from "./order/reserveation";
import { dateToString } from "@/utils/time";
import { orderInfoLabel } from "@/utils";

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
    AND NOT ${BUSY_SUBQUERY}
  `);
  return Number(result[0]?.count ?? 0) > 0;
}

export async function getOnlineConsultantsList(): Promise<OnlineConsultant[]> {
  return prisma.$queryRawUnsafe<OnlineConsultant[]>(`
    SELECT c."userId", c."cid", c."name", c."image", c."gender", c."category", c."rate", c."cost30"
    FROM consultants c
    WHERE c."online_status" = 'ONLINE'
    AND NOT ${BUSY_SUBQUERY}
  `);
}

// ─── Internal helpers ────────────────────────────────────────────────────────

async function getAvailableCount(): Promise<number> {
  const result = await prisma.$queryRawUnsafe<{ count: bigint }[]>(`
    SELECT COUNT(*) as count FROM consultants c
    WHERE c."online_status" = 'ONLINE'
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
) => {
  try {
    // parse
    const parsed = instantSchema.safeParse(formdata);

    // validate
    if (!parsed.success) return null;

    // data
    const data = parsed.data;

    // check time conflict
    const conflict = await checkMeetingTimeConflict(
      data.cid,
      data.time,
      dateToString(data.date),
    );

    // validate
    if (conflict) return null;

    // get owner data
    const owner = await prisma.consultant.findFirst({
      where: { cid: data.cid },
      select: { name: true, commission: true },
    });

    // if owner not exist
    if (!owner || !owner.name) return null;

    // onwer name & commission
    const { name, commission } = owner;

    // order commission if owner dont have specific commission set the default
    const oCommission = commission ? commission : data?.finance.commission;

    // create new reservation
    const order = await prisma.order.create({
      data: {
        author: data.user,
        consultantId: data.cid,
        name: data.name,
        phone: data.phone,
        description: data.notes,
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
          select: {
            name: true,
            userId: true,
            phone: true,
          },
        },
      },
    });

    // deactivate online state
    await broadcastConsultantBusy(order.consultant.userId);

    // return
    return order;
  } catch {
    // return
    return null;
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
