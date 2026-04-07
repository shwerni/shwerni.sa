"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma data
import { checkMeetingTimeConflict } from "./order/reserveation";

// lib
import { timeZone } from "@/lib/site/time";
import { createMeeting } from "@/lib/api/google";
import { notificationNewFreeSession } from "@/lib/notifications";

// utils
import {
  dateTimeToString,
  dateToString,
  getWeekStartSaturday,
} from "@/utils/time";

// schema
import { freeSessionSchema, freeSessionSchemaType } from "@/schemas";
import { Categories, Gender, Prisma } from "@/lib/generated/prisma/client";

// get all free sessions
export const getAllFreeSessions = async () => {
  try {
    // get all
    const sessions = await prisma.freeSession.findMany({
      orderBy: {
        created_at: "desc",
      },
      include: {
        consultant: {
          select: {
            name: true,
          },
        },
      },
    });
    // return
    return sessions;
  } catch {
    // return
    return null;
  }
};

// get all free sessions
export const getOwnerFreeTimings = async (cid: number) => {
  try {
    // get all
    const sessions = await prisma.freeTimings.findUnique({
      where: { consultantId: cid },
    });
    // return
    return sessions;
  } catch {
    // return
    return null;
  }
};

// get all free sessions
export const getOwnerFreeSessions = async (cid: number) => {
  try {
    // get all
    const sessions = await prisma.freeSession.findMany({
      where: { consultantId: cid },
    });
    // return
    return sessions;
  } catch {
    // return
    return null;
  }
};

// get owner free sessions time
export const getFreeSessionByFid = async (fid: number) => {
  try {
    // get timings
    const timings = await prisma.freeSession.findUnique({
      where: { fid },
      include: {
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });
    // return
    return timings;
  } catch {
    // return
    return null;
  }
};

// get owner free sessions time
export const reserveFreeSession = async (formdata: freeSessionSchemaType) => {
  try {
    // parse
    const parsed = freeSessionSchema.safeParse(formdata);

    // validate
    if (!parsed.success) return null;

    // data
    const data = parsed.data;

    // this phone number or user
    // const user = await prisma.freeSession.findMany({
    //   where: {
    //     OR: [
    //       { phone: data.phone },
    //       {
    //         AND: [{ author: { not: "temp" } }, { author: data.user }],
    //       },
    //     ],
    //   },
    //   select: {
    //     author: true,
    //   },
    // });

    // check conflict
    const check = await checkMeetingTimeConflict(
      data.cid,
      dateToString(data.date),
      data.time,
    );

    // validate
    if (check)
      return {
        message: "هذا الموعد محجز بالفعل برجاء اختيار موعد اخر",
        state: false,
      };

    // validate
    // if (user.length)
    //   return { message: "لقد استخدمت هذه الخدمة من قبل", state: false };

    // get timings
    const newSession = await prisma.freeSession.create({
      data: {
        author: data.user,
        name: data.name,
        phone: data.phone,
        consultantId: data.cid,
        time: data.time,
        date: dateToString(data.date),
        duration: "30",
        info: [
          `new free session | modified_at: ${dateTimeToString(new Date())}`,
        ],
      },
    });

    const consultant = await prisma.consultant.findUnique({
      where: { cid: data.cid },
      select: {
        phone: true,
      },
    });

    if (newSession && consultant) {
      // send notification
      notificationNewFreeSession(data.consultant, consultant.phone, newSession);
    }
    // return
    return { message: newSession.fid, state: true };
  } catch {
    // return
    return null;
  }
};

// get reservation
export const freeSessionAttendance = async (
  fid: number,
  participant: string,
  ownerAttend: boolean | null,
  clientAttend: boolean | null,
  time: string | null,
) => {
  try {
    // client attendance
    if (participant === "client" && !clientAttend) {
      // attendance
      const order = await prisma.freeSession.update({
        where: { fid },
        data: { clientAttend: true, clientATime: time },
        select: { fid: true },
      });
      // return
      return Boolean(order);
    }

    // attendance
    if (participant === "owner" && !ownerAttend) {
      const order = await prisma.freeSession.update({
        where: { fid },
        data: { ownerAttend: true, ownerATime: time },
        select: { fid: true },
      });
      // return
      return Boolean(order);
    }

    // if participant not exist or already signed
    return null;
  } catch {
    return null;
  }
};

// get meeting url if not exist create
export const freeSessionMeetingUrl = async (fid: number) => {
  try {
    // get order url
    const meeting = await prisma.freeSession.findFirst({
      where: { fid },
      select: { url: true, duration: true },
    });
    // return
    if (meeting?.url) return meeting.url;

    // create url if not exist
    const newUrl = await createMeeting();
    // update order
    await prisma.freeSession.update({
      where: { fid },
      data: { url: newUrl },
      select: { fid: true },
    });

    // return
    return newUrl;
  } catch {
    // return
    return null;
  }
};

// freesession
export const toggleFreesessionState = async (cid: number, status: boolean) => {
  try {
    // time
    const { iso: originDate } = timeZone();
    const currentWeekStart = getWeekStartSaturday(originDate);

    // update order
    await prisma.freeTimings.upsert({
      where: { consultantId: cid },
      create: {
        consultantId: cid,
        activeWeek: currentWeekStart,
        status,
      },
      update: {
        activeWeek: currentWeekStart,
        status,
      },
    });

    return true;
  } catch {
    return null;
  }
};

type ConsultantItem = {
  id: string;
  cid: number;
  image: string | null;
  name: string;
  title: string;
  rate: number | null;
  status: boolean;
  statusA: string;
  approved: string;
  created_at: Date;
  cost30: number;
  cost60: number;
  category: Categories;
  gender: Gender;
  review_count: number;
  years: number;
};
// get consultant free sessions
export const getFreeSessionConsultants = async (
  page: number = 1,
  search: string = "",
  categories?: string[],
  gender?: string[],
) => {
  try {
    const pageSize = 9;

    const { iso } = timeZone();
    const currentWeekStart = getWeekStartSaturday(iso);
    const past24h = new Date(iso.getTime() - 24 * 60 * 60 * 1000);

    const searchWhere = search
      ? Prisma.sql`AND LOWER(c.name) LIKE LOWER(${`%${search}%`})`
      : Prisma.empty;

    const categoryWhere =
      Array.isArray(categories) && categories.length > 0
        ? Prisma.sql`AND c."category" = ANY (${categories}::"Categories"[])`
        : Prisma.empty;

    const excludeBusy = Prisma.sql`
  AND NOT EXISTS (
    SELECT 1 FROM "free_sessions" fs
    WHERE fs."consultantId" = c."cid"
    AND fs."created_at" >= ${past24h}
  )
`;

    const genderWhere =
      Array.isArray(gender) && gender.length > 0
        ? Prisma.sql`AND c."gender" IN (${Prisma.join(
            gender.map((g) => Prisma.sql`${g}::"Gender"`),
          )})`
        : Prisma.empty;

    // ---------- COUNT ----------
    const result = await prisma.$queryRaw<{ count: bigint }[]>(
      Prisma.sql`
        SELECT COUNT(DISTINCT c.id)::bigint AS count
        FROM "consultants" c
        JOIN "free_timings" ft
          ON ft."consultantId" = c."cid"
        WHERE
          c."status"   = true
          AND c."statusA"  = 'PUBLISHED'::"ConsultantState"
          AND c."approved" = 'APPROVED'::"ApprovalState"
          AND ft."status"  = true
          AND ft."activeWeek" = ${currentWeekStart}
          ${searchWhere}
          ${categoryWhere}
          ${genderWhere}
          ${excludeBusy}
      `,
    );

    const total = Number(result[0]?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(page, 1), pages);
    const offset = (safePage - 1) * pageSize;

    // ---------- ITEMS ----------
    const items = await prisma.$queryRaw<ConsultantItem[]>(
      Prisma.sql`
        SELECT
          c.id,
          c.cid,
          c.name,
          c.title,
          c.image,
          c.created_at,
          c.rate,
          c."cost30",
          c."cost60",
          c."category"::text AS category,
          c."gender"::text   AS gender,
          COUNT(r.id)::int   AS review_count
        FROM "consultants" c
        JOIN "free_timings" ft
          ON ft."consultantId" = c."cid"
        LEFT JOIN "reviews" r
          ON r."consultantId" = c."cid"
        WHERE
          c."status"   = true
          AND c."statusA"  = 'PUBLISHED'::"ConsultantState"
          AND c."approved" = 'APPROVED'::"ApprovalState"
          AND ft."status"  = true
          AND ft."activeWeek" = ${currentWeekStart}
          ${searchWhere}
          ${categoryWhere}
          ${excludeBusy}
          ${genderWhere}
        GROUP BY
          c.id, c.cid, c.name, c.title, c.image,
          c.created_at, c.rate, c."cost30", c."cost60",
          c."category", c."gender"
        ORDER BY c."created_at" DESC
        LIMIT ${pageSize}
        OFFSET ${offset}
      `,
    );

    return {
      items,
      total,
      pages,
      page: safePage,
    };
  } catch (error) {
    console.log(error);
    return {
      items: [],
      total: 0,
      pages: 1,
      page: 1,
    };
  }
};
