"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { ProgramEnrollState, ProgramState } from "@/lib/generated/prisma/enums";

// get all consultant profiles
export const getAllProgramsAdmin = async () => {
  try {
    // get
    const programs = await prisma.program.findMany({
      orderBy: [
        {
          updated_at: "desc",
        },
        {
          created_at: "desc",
        },
      ],
    });
    // return
    return programs;
  } catch {
    return undefined;
  }
};

// get program by prid
export const getProgramByPridAdmin = async (prid: number) => {
  try {
    // get program
    const program = await prisma.program.findUnique({
      where: { prid },
      include: {
        ProgramConsultant: {
          select: {
            active: true,
            status: true,
            consultant: {
              select: {
                cid: true,
                name: true,
              },
            },
          },
        },
      },
    });

    // return
    return program;
  } catch {
    // return
    return null;
  }
};

// type
type UpdateProgramPayload = {
  prid: number;
  title: string;
  summary: string;
  description: string;
  price: number;
  duration: number;
  sessions: number;
  state: ProgramState;
  consultants: { cid: number; active: boolean; status: ProgramEnrollState }[];
};

// update program by prid
export const updateProgramAdmin = async (data: UpdateProgramPayload) => {
  const {
    prid,
    title,
    summary,
    description,
    price,
    duration,
    sessions,
    state,
    consultants,
  } = data;

  try {
    // Update program info
    const updatedProgram = await prisma.program.update({
      where: { prid },
      data: {
        title,
        summary,
        description,
        price,
        duration,
        sessions,
        status: state,
      },
    });

    // update consultant states
    for (const c of consultants) {
      await prisma.programConsultant.update({
        where: {
          consultantId_programId: {
            programId: prid,
            consultantId: c.cid,
          },
        },
        data: {
          active: c.active,
          status: c.status,
        },
      });
    }

    return updatedProgram;
  } catch (err) {
    return null;
  }
};
