import "server-only";

// prisma db
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";

// prisma types
import type { Categories } from "@/lib/generated/prisma/enums";

export interface MobileArticleRow {
  aid: number;
  title: string;
  article: string;
  length: number;
  read: number;
  image: string;
  category: Categories;
  created_at: Date;
  name: string | null;
  rate: number | null;
  likes_count: number;
}

/**
 * the app's article list: a copy of getArticles' query (data/article.ts, unchanged for the
 * website) with an optional category clause and the read count. published only, center
 * consultants' articles dropped, the same orders and paging
 */
export const getMobileArticles = async (
  page: number = 1,
  search: string = "",
  orderBy: "newest" | "viral" = "newest",
  pageSize: number = 9,
  category?: Categories,
) => {
  const clause =
    orderBy === "newest"
      ? Prisma.sql`a."created_at" DESC`
      : Prisma.sql`likes_count DESC, a."created_at" DESC`;

  const where = search
    ? Prisma.sql`AND LOWER(a.title) LIKE LOWER(${`%${search}%`})`
    : Prisma.empty;

  const byCategory = category
    ? Prisma.sql`AND a.category = ${category}::"Categories"`
    : Prisma.empty;

  // platform only: drop articles by a center consultant (articles without a consultant stay)
  const platformOnly = Prisma.sql`
    AND NOT EXISTS (
      SELECT 1 FROM "consultants" cx
      WHERE cx."cid" = a."consultantId" AND cx."centerId" IS NOT NULL
    )`;

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "articles" a
    WHERE a.status = 'PUBLISHED'::"ArticleState"
      ${where}
      ${byCategory}
      ${platformOnly}
  `;

  const total = Number(result[0]?.count ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pages);

  const items = await prisma.$queryRaw<MobileArticleRow[]>`
    SELECT
      a.aid,
      a.title,
      LEFT(a.article, 200)  AS article,
      LENGTH(a.article)     AS length,
      a.read,
      a.image,
      a.category::text      AS category,
      a.created_at,
      c.name,
      c.rate,
      COUNT(al.id)::int     AS likes_count
    FROM "articles" a
    LEFT JOIN "consultants"   c  ON c."cid"       = a."consultantId"
    LEFT JOIN "article_likes" al ON al."articleId" = a.id
    WHERE a.status = 'PUBLISHED'::"ArticleState"
      ${where}
      ${byCategory}
      ${platformOnly}
    GROUP BY a.id, a.aid, a.title, a.article, a.read, a.image, a.category,
             a.created_at, c.name, c.rate
    ORDER BY ${clause}
    LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}
  `;

  return { items, total, pages, page: safePage };
};
