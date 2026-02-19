"use server";
// prisma db
import prisma from "@/lib/database/db";

// schemas
import { MeetingSchema } from "@/schemas/admin";

// pacakge
import { z } from "zod";

// lib
import { PaymentState } from "@/lib/generated/prisma/enums";
import { Meeting } from "@/lib/generated/prisma/client";

// get all meetings
export const getAllMeetings = async () => {
  try {
    // get order url
    const orders = await prisma.order.findMany({
      where: {
        payment: {
          payment: PaymentState.PAID,
        },
      },
      include: {
        meeting: true,
        consultant: {
          select: {
            name: true,
          },
        },
      },
    });

    // all meetings
    const allMeetings = orders.flatMap((order) =>
      order.meeting.map((meeting) => ({
        ...meeting,
        oid: order.oid,
        consultant: order.consultant.name,
        name: order.name,
        phone: order.phone,
        type: order.type,
      })),
    );

    // sorted
    const sortedMeetings = allMeetings.sort((a, b) => {
      // sort
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return Number(dateB) - Number(dateA);
    });

    // return
    return sortedMeetings;
  } catch {
    // return
    return null;
  }
};

// update meeting
export const updateMeetingAdmin = async (
  oid: number,
  session: number,
  date: string,
  data: z.infer<typeof MeetingSchema>,
) => {
  // new data
  const validatedFields = MeetingSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields)
    return { state: false, message: "something went wrong" };

  try {
    // get all owner
    const order = await prisma.meeting.update({
      where: { orderId_session: { orderId: oid, session: session } },
      data: {
        date,
        time: data?.time,
        consultantAttendance: data?.consultantAttendance ?? false,
        clientAttendance: data?.clientAttendance ?? false,
        clientJoinedAt: data?.clientJoinedAt ?? "",
        consultantJoinedAt: data?.consultantJoinedAt ?? "",
        url: data?.url ?? "",
      },
    });
    // return
    return order;
  } catch (error) {
    // return
    return null;
  }
};

// passed meeting
export const getPassedMeetingAdmin = async () => {
  try {
    const meetings = await prisma.meeting.findMany({
      where: {
        orders: {
          payment: {
            payment: PaymentState.PAID,
          },
        },
        done: false,
        OR: [
          { url: null },
          { consultantAttendance: false },
          { clientAttendance: false },
        ],
      },
      include: {
        orders: {
          select: {
            oid: true,
            name: true,
            phone: true,
            consultant: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: {
        orders: {
          oid: "asc",
        },
      },
    });

    return meetings.map((m) => ({
      oid: m.orders?.oid,
      name: m.orders?.name,
      phone: m.orders?.phone,
      consultant: m.orders?.consultant.name,
      meeting: {
        date: m.date,
        time: m.time,
        session: m.session,
      },
    }));
  } catch {
    return null;
  }
};

type MeetingsWithOrder = {
  orders: {
    name: string;
    phone: string;
    consultant: { name: string };
    oid: number;
  };
} & Meeting;

export async function getMeetingsForManagments(page: number, search: string) {
  try {
    const limit = 10;
    const skip = (page - 1) * limit;

    // Base where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let where: any = {};

    if (search?.trim()) {
      if (search.startsWith("#")) {
        const oid = parseInt(search.slice(1).trim());
        if (!isNaN(oid)) {
          where.orderId = oid;
        }
      } else {
        where.OR = [
          { orders: { name: { contains: search, mode: "insensitive" } } },
          { orders: { phone: { contains: search, mode: "insensitive" } } },
          {
            orders: {
              consultant: {
                is: { name: { contains: search, mode: "insensitive" } },
              },
            },
          },
        ];
      }
    }

    // include meetings
    where.orders = {
      payment: {
        payment: PaymentState.PAID,
      },
    };

    const [meetings, totalCount] = await Promise.all([
      prisma.meeting.findMany({
        where,
        skip,
        take: limit,
        include: {
          orders: {
            select: {
              oid: true,
              name: true,
              phone: true,
              consultant: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [{ date: "desc" }, { time: "desc" }],
      }),
      prisma.meeting.count({ where }),
    ]);

    return {
      meetings: meetings as MeetingsWithOrder[],
      totalCount,
    };
  } catch (error) {
    console.log(error);
    // return
    return null;
  }
}

export async function updateMeetingStateManual(oid: number, session: number) {
  try {
    await prisma.meeting.update({
      where: {
        orderId_session: {
          orderId: oid,
          session,
        },
      },
      data: {
        done: true,
      },
    });
    // return
    return true;
  } catch {
    // return
    return true;
  }
}
