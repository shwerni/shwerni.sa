"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  ArticleState,
  ConsultantState,
  ProgramState,
} from "@/lib/generated/prisma/enums";

// all
export async function siteMapDynamic() {
  try {
    // connect on build
    await prisma.$connect();

    // programs
    const programs = await prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
      select: { prid: true, updated_at: true },
    });

    //  articles
    const articles = await prisma.article.findMany({
      where: { status: ArticleState.PUBLISHED },
      select: { aid: true, updated_at: true },
    });

    // consultants
    const consultants = await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
      },
      select: {
        cid: true,
        updated_at: true,
      },
    });
    // return
    return { consultants, articles, programs };
  } catch {
    // return
    return null;
  }
}

// consultants
export async function siteMapConsultants() {
  try {
    return await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
      },
      select: {
        cid: true,
        updated_at: true,
      },
    });
  } catch {
    return null;
  }
}

// articles
export async function siteMapArticles() {
  try {
    return await prisma.article.findMany({
      where: { status: ArticleState.PUBLISHED },
      select: {
        aid: true,
        updated_at: true,
      },
    });
  } catch {
    return null;
  }
}

// programs
export async function siteMapPrograms() {
  try {
    return await prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
      select: {
        prid: true,
        updated_at: true,
      },
    });
  } catch {
    return null;
  }
}
