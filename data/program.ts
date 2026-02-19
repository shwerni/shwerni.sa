"use server";
import prisma from "@/lib/database/db";
// lib

import {
  Consultant,
  Program,
  ProgramEnrollState,
  ProgramState,
  SessionType,
} from "@/lib/generated/prisma/client";
import { Prisma } from "@/lib/generated/prisma/client";
import { ProgramSchema } from "@/schemas";
import z from "zod";

// get programs
type OrderBy = "newest" | "oldest" | "viral";

type ProgramC = Program & {
  consultants: Pick<
    Consultant,
    "cid" | "name" | "image" | "category" | "gender" | "rate"
  >[];
};

export const getPrograms = async (
  page: number = 1,
  search = "",
  orderby: OrderBy = "newest",
  categories?: string[],
  specialties?: string,
) => {
  try {
    const pageSize = 9;
    const pageNum = typeof page === "string" ? Number(page) || 1 : (page ?? 1);

    // ORDER BY clause
    const clause =
      orderby === "newest"
        ? Prisma.sql`p."created_at" DESC`
        : orderby === "oldest"
          ? Prisma.sql`p."created_at" ASC`
          : Prisma.sql`p."rate" DESC NULLS LAST, p."created_at" DESC`;

    // search filter (title or summary)
    const searchWhere = search
      ? Prisma.sql`
        AND (
          LOWER(p.title)   LIKE LOWER(${`%${search}%`})
          OR LOWER(p.summary) LIKE LOWER(${`%${search}%`})
        )
      `
      : Prisma.empty;

    // category filter (enum Categories, multiple values)
    const categoryWhere =
      Array.isArray(categories) && categories.length > 0
        ? Prisma.sql`AND p."category" = ANY (${categories}::"Categories"[])`
        : Prisma.empty;

    // specialties filter – adjust column name/type as needed
    const specialtiesWhere = specialties
      ? Prisma.sql`AND p."specialties" = ${specialties}`
      : Prisma.empty;

    // COUNT
    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*)::bigint AS count
      FROM "programs" p
      WHERE 1 = 1
        AND p."status" = 'PUBLISHED'
        ${searchWhere}
        ${categoryWhere}
        ${specialtiesWhere}
    `;

    const total = Number(countResult[0]?.count ?? 0);
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(pageNum, 1), pages);

    // ITEMS
    const items = await prisma.$queryRaw<Program[]>`
      SELECT
        p.id,
        p.prid,
        p.title,
        p.summary,
        p.duration,
        p.commission,
        p.description,
        p.image,
        p."category"::text AS category,
        p.price,
        p.sessions,
        p.features,
        p.rate,
        p."status"::text AS status,
        p.created_at,
        p.updated_at
      FROM "programs" p
      WHERE 1 = 1
        AND p."status" = 'PUBLISHED'
        ${searchWhere}
        ${categoryWhere}
        ${specialtiesWhere}
      ORDER BY ${clause}
      LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}
    `;

    return {
      items,
      total,
      pages,
      page: safePage,
    };
  } catch {
    return {
      items: [],
      total: 0,
      pages: 1,
      page: 1,
    };
  }
};

// get all program
export const getAllPrograms = async () => {
  try {
    // get program
    const program = await prisma.program.findMany();

    // return
    return program;
  } catch {
    // return
    return null;
  }
};

// get all program
export const getAllPublishedPrograms = async () => {
  try {
    // get program
    const program = await prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
    });

    // return
    return program;
  } catch {
    // return
    return [];
  }
};

// get program by prid
export const getProgram = async (prid: number) => {
  try {
    const program = await prisma.$queryRaw<ProgramC[]>(Prisma.sql`
      SELECT 
        p.*,
        COALESCE(pc.consultants, '[]') AS consultants
      FROM programs p
      LEFT JOIN LATERAL (
        SELECT json_agg(
          json_build_object(
            'cid', c.cid,
            'name', c.name,
            'image', c.image,
            'gender', c.gender,
            'category', c.category,
            'rate', c.rate
          )
        ) AS consultants
        FROM program_consultants pc
        JOIN consultants c 
          ON c.cid = pc."consultantId"
        WHERE pc."programId" = p.prid
          AND pc.active = true
          AND pc.status = 'APPROVED'
      ) pc ON true
      WHERE p.prid = ${prid}
    `);

    return program[0] ?? null;
  } catch (error) {
    console.error(error);
    return null;
  }
};

// get program by prid
export const getProgramByPrid = async (prid: number) => {
  try {
    // get program
    const program = await prisma.program.findUnique({
      where: { prid },
    });

    // return
    return program;
  } catch {
    // return
    return null;
  }
};

// get program by prid
export const getProgramInfo = async (prid: number) => {
  try {
    // get program
    const program = await prisma.program.findUnique({
      where: { prid },
      select: {
        title: true,
        description: true,
        image: true,
        status: true,
      },
    });

    // return
    return program;
  } catch {
    // return
    return null;
  }
};

// get program by prid
export const getProgramAvailableConsultants = async (prid: number) => {
  try {
    // get program
    const program = await prisma.program.findUnique({
      where: { prid },
      select: { prid: true },
    });

    // validate
    if (!program) throw new Error("Program not found");

    // approved consultants
    const approved = await prisma.programConsultant.findMany({
      where: {
        programId: program.prid,
        status: ProgramEnrollState.APPROVED,
        active: true,
      },
      include: {
        consultant: true,
      },
    });

    // consultant
    const consultants = approved.map((c) => c.consultant);

    // return
    return consultants;
  } catch {
    // return
    return null;
  }
};

// get program by prid
export const getProgramConsultantsByPrid = async (prid: number) => {
  try {
    // consultants
    const consultants = await prisma.programConsultant.findMany({
      where: { programId: prid },
      include: {
        consultant: true,
      },
    });

    // return
    return consultants;
  } catch {
    // return
    return null;
  }
};

// session selection
export const checkProgramNextSession = async (oid: number, session: number) => {
  try {
    // get program
    const order = await prisma.order.findUnique({
      where: { oid },
      include: {
        meeting: true,
        program: true,
        payment: true,
        consultant: {
          select: {
            phone: true,
            name: true,
          },
        },
      },
    });

    // validate
    if (!order) return false;

    // validate
    if (order.session !== SessionType.MULTIPLE) return false;

    // meeting
    const meeting = order.meeting;

    // current session
    const current = meeting.length;

    // validate
    if (order.sessionCount === current && session === order.sessionCount)
      return false;

    if (order.program?.title)
      // send session selection
      // notificationProgramSession(order, order.program.title, session + 1);

      // return
      return true;
  } catch {
    // return
    return null;
  }
};

// session selection
export const selectProgramSession = async (
  oid: number,
  time: string,
  date: string,
  session: number,
) => {
  try {
    // get program
    const order = await prisma.order.findUnique({
      where: { oid },
      include: {
        meeting: true,
        program: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // validate
    if (!order) return false;

    // validate
    if (order.session !== SessionType.MULTIPLE) return false;

    // create meeting
    const newMeeting = await prisma.meeting.create({
      data: {
        orderId: oid,
        duration: "60",
        session,
        time,
        date,
      },
      select: { orderId: true },
    });

    // validate
    // if (newMeeting) {
    //   // notification
    //   if (order.program)
    //     // notificationProgramSessionConfirm(
    //     //   oid,
    //     //   order.program.title,
    //     //   order.name,
    //     //   order.consultant.name,
    //     //   order.phone,
    //     //   order.consultant.phone,
    //     //   session,
    //     //   order.sessionCount,
    //     //   time,
    //     //   date
    //     // );
    // }
    // return
    return newMeeting;
  } catch {
    // return
    return null;
  }
};

export async function EnrollOnProgram(prid: number, cid: number) {
  try {
    const enroll = await prisma.programConsultant.create({
      data: {
        programId: prid,
        consultantId: cid,
      },
    });

    return enroll;
  } catch {
    return null;
  }
}

export async function toggleProgramState(
  prid: number,
  cid: number,
  active: boolean,
) {
  try {
    const enroll = await prisma.programConsultant.update({
      where: {
        consultantId_programId: { consultantId: cid, programId: prid },
      },
      data: {
        active,
      },
    });

    return enroll;
  } catch {
    return null;
  }
}

export async function getConsultantProgramByCid(prid: number, cid: number) {
  try {
    const enroll = await prisma.programConsultant.findUnique({
      where: {
        consultantId_programId: { consultantId: cid, programId: prid },
      },
    });

    return enroll;
  } catch {
    return null;
  }
}

export async function createNewProgram(data: z.infer<typeof ProgramSchema>) {
  try {
    const newProgram = await prisma.program.create({
      data: {
        title: data.title,
        summary: data.summary,
        duration: data.duration,
        description: data.description,
        category: data.category,
        price: data.price,
        sessions: data.sessions,
        features: data.features,
        status: ProgramState.HOLD,
        image:
          "https://shwerni.sa/_next/image?url=%2Flayout%2Fshwerni.jpg&w=256&q=75",
        rate: null,
      },
    });

    return newProgram;
  } catch {
    return null;
  }
}