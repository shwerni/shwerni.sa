"use server";
// prisma db
import prisma from "@/lib/database/db";
import { Prisma } from "@/lib/generated/prisma/client";

// types
import { ArticleItem } from "@/types/layout";

// prisma types
import { BlogState, CommentState, Gender } from "@/lib/generated/prisma/enums";
import { Categories } from "@/lib/generated/prisma/enums";

// get all published questions
// export const getArticles = async (
//   page: number = 1,
//   search: string = "",
//   orderBy: "newest" | "oldest" | "viral" = "newest",
//   pageSize: number = 9
// ) => {
//   const clause =
//     orderBy === "newest"
//       ? Prisma.sql`"created_at" DESC`
//       : orderBy === "oldest"
//       ? Prisma.sql`"created_at" ASC`
//       : Prisma.sql`likes DESC, "created_at" DESC`;

//   const where = search
//     ? Prisma.sql`AND LOWER(a.title) LIKE LOWER(${`%${search}%`})`
//     : Prisma.empty;

//   const [items, totalResult] = await Promise.all([
//     await prisma.$queryRaw<ArticleItem[]>`
//     SELECT
//       a.aid,
//       a.title,
//       LEFT(a.article, 200) AS article,
//       LENGTH(a.article) AS length,
//       a.image,
//       a.category::text AS category,
//       COALESCE(array_length(a.likes, 1), 0) AS likes,
//       a.created_at,
//       c.name,
//       c.rate
//     FROM "articles" a
//     LEFT JOIN "consultants" c ON c."cid" = a."consultantId"
//     WHERE a.status = 'PUBLISHED'
//       ${where}
//     ORDER BY ${clause}
//     LIMIT ${pageSize} OFFSET ${(page - 1) * pageSize}
//   `,
//     await prisma.$queryRaw<{ count: bigint }[]>`
//     SELECT COUNT(*)::bigint AS count
//     FROM "articles" a
//     WHERE a.status = 'PUBLISHED'
//       ${where}
//   `,
//   ]);

//   const total = Number(totalResult[0]?.count ?? 0);

//   return {
//     items,
//     total,
//     pages: Math.ceil(total / pageSize),
//     page,
//   };
// };

export const getArticles = async (
  page: number = 1,
  search: string = "",
  orderBy: "newest" | "oldest" | "viral" = "newest",
  pageSize: number = 9,
) => {
  const clause =
    orderBy === "newest"
      ? Prisma.sql`a."created_at" DESC`
      : orderBy === "oldest"
        ? Prisma.sql`a."created_at" ASC`
        : Prisma.sql`likes_count DESC, a."created_at" DESC`;

  const where = search
    ? Prisma.sql`AND LOWER(a.title) LIKE LOWER(${`%${search}%`})`
    : Prisma.empty;

  const result = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS count
    FROM "articles" a
    WHERE a.status = 'PUBLISHED'
      ${where}
  `;

  const total = Number(result[0]?.count ?? 0);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), pages);

  const items = await prisma.$queryRaw<ArticleItem[]>`
    SELECT
      a.aid,
      a.title,
      LEFT(a.article, 200)  AS article,
      LENGTH(a.article)     AS length,
      a.image,
      a.category::text      AS category,
      a.created_at,
      c.name,
      c.rate,
      COUNT(al.id)::int     AS likes_count
    FROM "articles" a
    LEFT JOIN "consultants"   c  ON c."cid"       = a."consultantId"
    LEFT JOIN "article_likes" al ON al."articleId" = a.id
    WHERE a.status = 'PUBLISHED'
      ${where}
    GROUP BY a.id, a.aid, a.title, a.article, a.image, a.category,
             a.created_at, c.name, c.rate
    ORDER BY ${clause}
    LIMIT ${pageSize} OFFSET ${(safePage - 1) * pageSize}
  `;

  return {
    items,
    total,
    pages,
    page: safePage,
  };
};

// get similar articles
export const getSimilarArticles = async () => {
  try {
    const results = await prisma.$queryRaw<
      {
        aid: number;
        title: string;
        image: string;
        created_at: Date;
        length: number;
      }[]
    >`
    SELECT
      a."aid",
      a."title",
      a."image",
      LENGTH(a.article) AS length,
      a.created_at
    FROM "articles" a
    ORDER BY RANDOM()
    LIMIT 3
  `;

    return results ?? [];
  } catch {
    return [];
  }
};

// get recommended consultant
export const getRecommendedConsultants = async () => {
  try {
    const results = await prisma.$queryRaw<
      {
        cid: number;
        name: string;
        image: string | null;
        category: Categories;
        gender: Gender;
        rate: number | null;
      }[]
    >`
      SELECT
        c."cid",
        c."name",
        c."gender",
        c."image",
        c."rate",
        c."category"
      FROM "consultants" c
      WHERE c."statusA" = 'PUBLISHED'
        AND c."approved" = 'APPROVED'
      ORDER BY RANDOM()
      LIMIT 3
    `;

    return results ?? [];
  } catch {
    return [];
  }
};

// get all published questions
export const getAllPublishedArticles = async () => {
  try {
    const Articles = await prisma.article.findMany({
      where: { status: BlogState.PUBLISHED },
    });
    return Articles;
  } catch {
    return null;
  }
};

// get all published questions
export const getAllPublishedArticlesIds = async () => {
  try {
    const Articles = await prisma.article.findMany({
      where: { status: BlogState.PUBLISHED },
      select: { aid: true },
    });
    return Articles;
  } catch {
    return null;
  }
};

// get question's title by qid
export const getArticleTitleByBid = async (aid: number) => {
  try {
    const Article = await prisma.article.findFirst({
      where: { aid },
      select: { title: true },
    });
    return Article?.title;
  } catch {
    return null;
  }
};

// get question by qid
export const getArticleByAid = async (aid: number) => {
  try {
    const article = await prisma.article.findUnique({
      where: { aid },
      include: {
        consultant: { select: { name: true } },
        specialties: { select: { specialty: true } },
      },
    });

    if (!article) return null;

    return article;
  } catch {
    return null;
  }
};

export const getArticleLikes = async (aid: number, userId: string | null) => {
  try {
    const article = await prisma.article.findUnique({
      where: { aid },
      select: {
        id: true,
        _count: { select: { likes: true } },
      },
    });

    if (!article) return { liked: false, count: 0 };

    const liked = userId
      ? !!(await prisma.articleLike.findUnique({
          where: {
            articleId_userId: { articleId: article.id, userId },
          },
          select: { id: true },
        }))
      : false;

    return {
      liked,
      count: article._count.likes,
    };
  } catch {
    return { liked: false, count: 0 };
  }
};

// increment read
export async function incrementArticleRead(aid: number) {
  await prisma.article.update({
    where: { aid },
    data: {
      read: { increment: 1 },
    },
  });
}

// get Meta Data By pid
export const getArticleMetaData = async (aid: number) => {
  try {
    const Article = await prisma.article.findFirst({
      where: { aid },
      select: {
        title: true,
        image: true,
        consultant: { select: { name: true } },
      },
    });
    return Article;
  } catch {
    return null;
  }
};

export async function toggleArticleLike(
  aid: number,
  userId: string,
): Promise<{ liked: boolean; count: number }> {
  const article = await prisma.article.findUnique({
    where: { aid },
    select: { id: true },
  });

  if (!article) throw new Error("Article not found");

  const existing = await prisma.articleLike.findUnique({
    where: {
      articleId_userId: {
        articleId: article.id,
        userId,
      },
    },
  });

  if (existing) {
    await prisma.articleLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.articleLike.create({
      data: { articleId: article.id, userId },
    });
  }

  const count = await prisma.articleLike.count({
    where: { articleId: article.id },
  });

  return {
    liked: !existing,
    count,
  };
}

interface AddArticleCommentInput {
  aid: number;
  name: string;
  comment: string;
  rate: number;
  author?: string;
}

export async function addArticleComment(input: AddArticleCommentInput) {
  try {
    // check if conultant
    const consultant = input.author
      ? await prisma.consultant.findUnique({
          where: {
            userId: input.author,
          },
          select: { cid: true },
        })
      : null;

    await prisma.articleComment.create({
      data: {
        articleId: input.aid,
        name: input.name,
        comment: input.comment,
        rate: input.rate,
        author: input.author ?? null,
        consultantId: consultant?.cid ?? null,
        userId: input.author ?? null,
      },
    });

    return { success: true };
  } catch (error) {
    console.log(error);

    return { success: false };
  }
}

export async function getArticleComments(aid: number) {
  return prisma.articleComment.findMany({
    where: { articleId: aid, status: CommentState.PUBLISHED },
    orderBy: [{ consultantId: "asc" }, { created_at: "desc" }],
    include: {
      consultant: {
        select: { cid: true, name: true, image: true, gender: true },
      },
    },
  });
}
