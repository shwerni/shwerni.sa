import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  ProgramState,
  type ProgramEnrollState,
} from "@/lib/generated/prisma/enums";

// data
import type { PublicProgram } from "@/data/programs";

// this consultant's enrollment in a program, null when not enrolled
export type OwnerEnrollment = { status: ProgramEnrollState; active: boolean } | null;

// GET /api/mobile/owner/programs -> programs[]
export type OwnerProgram = PublicProgram & { enrollment: OwnerEnrollment };

// GET /api/mobile/owner/programs/{prid} -> program
export type OwnerProgramDetails = OwnerProgram & { description: string; features: string[] };

// the PublicProgram columns (the app's program cards): never commission
const publicProgramSelect = {
  id: true,
  prid: true,
  title: true,
  summary: true,
  image: true,
  category: true,
  price: true,
  sessions: true,
  duration: true,
  rate: true,
} as const;

/**
 * the published programs, newest first, with this consultant's enrollment in each
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 */
export const getOwnerPrograms = async (cid: number): Promise<OwnerProgram[]> => {
  const [programs, enrollments] = await Promise.all([
    prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
      select: publicProgramSelect,
      orderBy: { created_at: "desc" },
    }),
    prisma.programConsultant.findMany({
      where: { consultantId: cid },
      select: { programId: true, status: true, active: true },
    }),
  ]);

  const byProgram = new Map(
    enrollments.map((row) => [row.programId, { status: row.status, active: row.active }]),
  );

  return programs.map((program) => ({
    ...program,
    enrollment: byProgram.get(program.prid) ?? null,
  }));
};

/**
 * one published program with its description and features, and this consultant's enrollment
 * (the website's getProgramByPrid + getConsultantProgramByCid, with a select). null when the
 * program is missing or not published
 * @param cid the owner's own consultant id (from requireApprovedOwner)
 * @param prid the program id from the url
 */
export const getOwnerProgram = async (
  cid: number,
  prid: number,
): Promise<OwnerProgramDetails | null> => {
  const [program, enrollment] = await Promise.all([
    prisma.program.findUnique({
      where: { prid },
      select: { ...publicProgramSelect, description: true, features: true, status: true },
    }),
    prisma.programConsultant.findUnique({
      where: { consultantId_programId: { consultantId: cid, programId: prid } },
      select: { status: true, active: true },
    }),
  ]);
  if (!program || program.status !== ProgramState.PUBLISHED) return null;

  return {
    id: program.id,
    prid: program.prid,
    title: program.title,
    summary: program.summary,
    image: program.image,
    category: program.category,
    price: program.price,
    sessions: program.sessions,
    duration: program.duration,
    rate: program.rate,
    description: program.description,
    features: program.features,
    enrollment,
  };
};
