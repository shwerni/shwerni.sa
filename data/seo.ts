import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  ApprovalState,
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
      select: { aid: true, created_at: true, },
    });

    // consultants: the same visibility rule as /consultants/[cid], so no entry is a 404
    const consultants = await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
        approved: ApprovalState.APPROVED,
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
