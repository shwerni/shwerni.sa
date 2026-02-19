"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  ArticleState,
  ConsultantState,
  ProgramState,
} from "@/lib/generated/prisma/enums";

export async function siteMapDynamic() {
  try {
    // connect on build
    await prisma.$connect();

    // programs
    const programs = await prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
      select: { prid: true },
    });

    //  articles
    const articles = await prisma.article.findMany({
      where: { status: ArticleState.PUBLISHED },
      select: { aid: true },
    });

    // consultants
    const consultants = await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
      },
      select: {
        cid: true,
      },
    });
    // return
    return { consultants, articles, programs };
  } catch {
    // return
    return null;
  }
}
