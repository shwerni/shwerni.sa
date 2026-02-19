"use server";
// prisma db
import prisma from "@/lib/database/db";

// package
// import { gzipSync, gunzipSync } from "zlib";

// primsa types
import { ArticleState, Categories } from "@/lib/generated/prisma/enums";

// get all Articles
export const getAllArticlesAdmin = async () => {
  try {
    // get all Articles
    const Articles = await prisma.article.findMany({
      orderBy: {
        created_at: "desc",
      },
    });

    // if not exist
    if (!Articles) return null;

    // return Articles
    return Articles;
  } catch {
    return null;
  }
};

export const getArticlesByAidAdmin = async (aid: number) => {
  try {
    // get all Articles
    const Articles = await prisma.article.findUnique({ where: { aid } });

    // if not exist
    if (!Articles) return null;

    // return Articles
    return Articles;
  } catch {
    return null;
  }
};

export async function updateArticleByAidAdmin(
  aid: number,
  title: string,
  image: string,
  article: string,
  category: Categories,
  status: ArticleState,
) {
  try {
    // get all Articles
    const updated = await prisma.$executeRawUnsafe(
      `
      UPDATE "articles"
      SET "title" = $1,
          "image" = $2,
          "article" = $3,
          "category" = $4::"Categories",
          "status" = $5::"ArticleState"
      WHERE "aid" = $6
      `,
      title,
      image,
      article,
      category,
      status,
      aid,
    );

    // if not exist
    if (!updated) return null;

    // return Articles
    return updated;
  } catch (error) {
    console.log(error);
    return null;
  }
}

export async function createArticleAdmin(
  title: string,
  image: string,
  article: string,
  category: Categories,
  status: ArticleState,
) {
  try {
    // get all Articles
    const create = await prisma.article.create({
      data: {
        title,
        image,
        article,
        category,
        status,
      },
    });

    // if not exist
    if (!create) return null;

    // return Articles
    return create;
  } catch (error) {
    console.log(error);
    return null;
  }
}
