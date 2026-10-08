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

// sitemap rows, one query per sitemap type (app/sitemaps/*). each list matches its page's
// visibility rule, so no entry is a 404 or noindex

// consultants: the same rule as /consultants/[cid] (status, published, approved). the safe
// client adds centerId: null, so center consultants (who live under /centers) are excluded
export async function siteMapConsultants() {
  try {
    return await prisma.consultant.findMany({
      where: {
        status: true,
        statusA: ConsultantState.PUBLISHED,
        approved: ApprovalState.APPROVED,
      },
      // cid only: the consultants sitemap has no lastmod (updated_at moves on presence updates)
      select: { cid: true },
      orderBy: { cid: "asc" },
    });
  } catch {
    return [];
  }
}

// articles: published only, like /articles/[aid]. the article table has no updated_at, so
// created_at is the stored date
export async function siteMapArticles() {
  try {
    return await prisma.article.findMany({
      // the same rule as /articles/[aid] (getArticleByAid): published, and not by a center
      // consultant (articles without a consultant stay)
      where: {
        status: ArticleState.PUBLISHED,
        NOT: { consultant: { is: { centerId: { not: null } } } },
      },
      select: { aid: true, created_at: true },
      orderBy: { aid: "asc" },
    });
  } catch {
    return [];
  }
}

// programs: published only, like /programs/[prid]
export async function siteMapPrograms() {
  try {
    return await prisma.program.findMany({
      where: { status: ProgramState.PUBLISHED },
      select: { prid: true, updated_at: true },
      orderBy: { prid: "asc" },
    });
  } catch {
    return [];
  }
}

// does a public detail page exist? the same rules as the pages' notFound() calls, so proxy.ts
// can answer a real 404 before any html is sent (a page's own notFound() can't change the
// status once the prerendered shell has streamed). each query is a count on an index
export type PublicDetail = "article" | "consultant" | "program" | "scale";

export async function publicDetailExists(kind: PublicDetail, key: string) {
  switch (kind) {
    // getArticleByAid
    case "article":
      return (
        (await prisma.article.count({
          where: {
            aid: Number(key),
            status: ArticleState.PUBLISHED,
            NOT: { consultant: { is: { centerId: { not: null } } } },
          },
        })) > 0
      );
    // isConsultantVisible on getConsultantInfo (the safe client adds centerId: null)
    case "consultant":
      return (
        (await prisma.consultant.count({
          where: {
            cid: Number(key),
            status: true,
            statusA: ConsultantState.PUBLISHED,
            approved: ApprovalState.APPROVED,
          },
        })) > 0
      );
    // getProgramInfo + status === PUBLISHED
    case "program":
      return (
        (await prisma.program.count({
          where: { prid: Number(key), status: ProgramState.PUBLISHED },
        })) > 0
      );
    // getScaleBySlug
    case "scale":
      return (
        (await prisma.scale.count({ where: { slug: key, isActive: true } })) > 0
      );
  }
}
