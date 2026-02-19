"use server";
// prisma db

// packages
import moment from "moment";
import { endOfDay, startOfDay } from "date-fns";

// prisma data
import {
  alreadyReservedTimes,
  checkMeetingTimeConflict,
} from "./order/reserveation";

// lib
import { createMeeting } from "@/lib/api/google";
import { notificationNewFreeSession } from "@/lib/notifications";

// utils
import { dateTimeToString, getWeekStartSaturday } from "@/utils/moment";
import prisma from "@/lib/database/db";
import { ConsultantState } from "@/lib/generated/prisma/enums";
import { timeZone } from "@/lib/site/time";

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
export const getOwnerFreeSessionTimings = async (cid: number) => {
  try {
    // get timings
    const timings = await prisma.freeTimings.findUnique({
      where: { consultantId: cid },
    });

    // validate
    if (!timings) return null;

    // return
    return timings.time;
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
export const getFreeTimingsByAuthor = async (author: string) => {
  try {
    // get timings
    const timings = await prisma.freeTimings.findUnique({
      where: { userId: author },
    });
    // return
    return timings;
  } catch {
    // return
    return null;
  }
};

// get all owners free sessions time
export const getFreeSessionOwners = async (date: string, time: string) => {
  // try {
  //   // validate
  //   if (!time || !date) return null;
  //   // origin date
  //   const originDate = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").toDate();
  //   // this week
  //   const activeWeek = getWeekStartSaturday(originDate);
  //   // range this day // not month
  //   const start = startOfDay(originDate); // startOfMonth(originDate);
  //   const end = endOfDay(originDate); // endOfMonth(originDate);
  //   // get cids
  //   const cids = await prisma.freeTimings.findMany({
  //     where: { activeWeek, status: true },
  //     select: { consultantId: true, time: true },
  //   });
  //   // validate
  //   if (!cids) return null;
  //   // session ( all free session owner's cids ) cids array
  //   const SCids = cids.map((i) => i.consultantId);
  //   // sessions
  //   const sessions = await prisma.freeSession.findMany({
  //     where: {
  //       created_at: {
  //         gte: start,
  //         lte: end,
  //       },
  //       consultantId: {
  //         in: SCids,
  //       },
  //     },
  //     select: {
  //       consultantId: true,
  //     },
  //   });
  //   // final cids
  //   const NCids = new Set(sessions.map((s) => s.consultantId));
  //   // filter cids
  //   const fCids = SCids.filter((cid) => !NCids.has(cid));
  //   // get consultant
  //   const owners = await prisma.consultant.findMany({
  //     where: {
  //       cid: { in: fCids },
  //       status: true,
  //       statusA: ConsultantState.PUBLISHED,
  //     },
  //   });
  //   // if not exist
  //   if (!owners) return null;
  //   // final onwer and times
  //   const result = await Promise.all(
  //     owners.map(async (o) => {
  //       const timing = cids.find((t) => t.consultantId === o.cid);
  //       const time = timing?.time;
  //       // remove past due times
  //       const validTimes = time.filter((t) => {
  //         return moment(t, "HH:mm").isSameOrAfter(moment(time, "HH:mm"));
  //       });
  //       // get already reserved times
  //       const reservedTimes = await alreadyReservedTimes(o.cid, date);
  //       // apply reserved filter
  //       const iTimes = validTimes
  //         .map((t) => initialTimes(t))
  //         .filter((i): i is NonNullable<typeof i> => Boolean(i));
  //       const filtered = reservedFilter(iTimes, validTimes, reservedTimes);
  //       return {
  //         ...o,
  //         day5: filtered.map((f) => f.value),
  //       };
  //     })
  //   );
  //   // availble owners
  //   const available = result.filter((r) => r.day5.length > 0);
  //   // return
  //   return available;
  // } catch {
  //   // return
  //   return null;
  // }
};

// get all owners free sessions time
export const getAllFreeSessionOwners = async (date: string, time: string) => {
  try {
    // origin date
    const originDate = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").toDate();
    // this week
    const activeWeek = getWeekStartSaturday(originDate);
    // range this day // not month
    const start = startOfDay(originDate); // startOfMonth(originDate);
    const end = endOfDay(originDate); // endOfMonth(originDate);
    // get cids
    // get cids
    const timings = await prisma.freeTimings.findMany({
      where: { activeWeek, status: true },
      select: { consultantId: true, time: true },
    });
    if (!timings) return null;

    const consultantIds = timings.map((i) => i.consultantId);

    // sessions for this day
    const sessions = await prisma.freeSession.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
        consultantId: {
          in: consultantIds,
        },
      },
      select: { consultantId: true },
    });

    // consultants
    const owners = await prisma.consultant.findMany({
      where: {
        cid: { in: consultantIds },
        status: true,
        statusA: ConsultantState.PUBLISHED,
      },
    });
    if (!owners) return null;

    // final owner + times
    const result = await Promise.all(
      owners.map(async (o) => {
        const timing = timings.find((t) => t.consultantId === o.cid);

        // handle time (string or array if stored as JSON)
        let times: string[] = [];
        if (timing?.time) {
          try {
            // if stored as JSON array
            times = JSON.parse(timing.time);
          } catch {
            // fallback: comma-separated string
            times = timing.time.split(",").map((s) => s.trim());
          }
        }

        // reserved times
        const reservedTimes = (await alreadyReservedTimes(o.cid, date)) ?? [];

        // check if session exists for today
        const hasSessionToday = sessions.some((s) => s.consultantId === o.cid);

        // mark reserved
        const timesWithStatus = times.map((t) => {
          const isPast = moment(t, "HH:mm").isBefore(moment(time, "HH:mm"));
          const isReserved =
            hasSessionToday ||
            reservedTimes.some((rt) =>
              moment(rt, "HH:mm").isSame(moment(t, "HH:mm")),
            );
          return {
            value: t,
            isPast,
            reserved: isReserved,
          };
        });

        return {
          ...o,
          times: timesWithStatus,
        };
      }),
    );

    // available owners
    return result.filter((r) => r.times.length > 0);
  } catch {
    return null;
  }
};

// get owner free sessions time
export const saveOwnerFreeSessionTimings = async (
  author: string,
  cid: number,
  time: string,
) => {
  try {
    // get timings
    const timings = await prisma.freeTimings.findUnique({
      where: { consultantId: cid },
      select: { consultantId: true },
    });

    // if timings not exist create
    if (!timings) {
      await prisma.freeTimings.create({
        data: {
          userId: author,
          consultantId: cid,
          time: time,
        },
      });
      // return
      return true;
    }
    // if exist update
    await prisma.freeTimings.update({
      where: { consultantId: cid },
      data: {
        time,
      },
    });
    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// get owner free sessions time
export const reserveFreeSession = async (
  author: string,
  cid: number,
  consultant: string,
  name: string,
  phone: string,
  cophone: string,
  time: string,
  date: string,
  duration: string,
) => {
  try {
    // validate
    if (!time || !date) return { message: "حدث خطأ ما", state: false };

    // origin date
    const originDate = moment(`${date} ${time}`, "YYYY-MM-DD HH:mm").toDate();

    // range this day // not month
    const start = startOfDay(originDate);
    const end = endOfDay(originDate);

    // sessions this month
    const session = await prisma.freeSession.findMany({
      where: {
        created_at: {
          gte: start,
          lte: end,
        },
        consultantId: cid,
      },
      select: {
        consultantId: true,
      },
    });

    // this phone number or user
    const user = await prisma.freeSession.findMany({
      where: {
        OR: [
          { phone },
          {
            AND: [{ author: { not: "temp" } }, { author }],
          },
        ],
      },
      select: {
        author: true,
      },
    });

    // check conflict
    const check = checkMeetingTimeConflict(cid, date, time);

    // validate
    if (!check)
      return {
        message: "هذا الموعد محجز بالفعل برجاء اختيار موعد اخر",
        state: false,
      };

    // validate
    if (user.length)
      return { message: "لقد استخدمت هذه الخدمة من قبل", state: false };

    // check if no free session on this consultant
    if (session.length !== 0)
      return { message: "هذا المستشار مشغول بأستشارة اخره", state: false };

    // get timings
    const newSession = await prisma.freeSession.create({
      data: {
        author,
        name,
        phone,
        consultantId: cid,
        time,
        date,
        duration,
        info: [
          `new free session | modified_at: ${dateTimeToString(new Date())}`,
        ],
        created_at: originDate,
      },
    });

    if (newSession) {
      // send notification
      notificationNewFreeSession(consultant, cophone, newSession);
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
    const newUrl = await createMeeting(Number(meeting?.duration) + 5);
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
export const toggleFreesessionState = async (
  author: string,
  cid: number,
  status: boolean,
) => {
  try {
    // time
    const { iso: originDate } = timeZone();

    // update order
    await prisma.freeTimings.upsert({
      where: { userId: author },
      create: {
        userId: author,
        consultantId: cid,
        activeWeek: getWeekStartSaturday(originDate),
        status,
      },
      update: { activeWeek: getWeekStartSaturday(originDate), status },
    });

    return true;
  } catch {
    return null;
  }
};
