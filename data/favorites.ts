"use server";

import prisma from "@/lib/database/db";
import { Consultant } from "@/lib/generated/prisma/client";

export async function toggleFavorite(userId: string, consultantId: number) {
  // Check if the favorite already exists
  const existing = await prisma.favorite.findUnique({
    where: {
      userId_consultantId: {
        userId,
        consultantId,
      },
    },
  });

  if (existing) {
    await prisma.favorite.delete({
      where: {
        userId_consultantId: {
          userId,
          consultantId,
        },
      },
    });
    return false;
  } else {
    await prisma.favorite.create({
      data: {
        userId,
        consultantId,
      },
    });
    return true;
  }
}

export async function getFavorites(userId: string) {
  try {
    const result = await prisma.$queryRaw<
      {
        favorites: number[];
        consultants: Consultant[];
      }[]
    >`
      SELECT
        COALESCE(ARRAY_AGG(DISTINCT c."cid"), '{}') AS favorites,
        COALESCE(JSON_AGG(DISTINCT c), '[]') AS consultants
      FROM "favorites" f
      JOIN "consultants" c
        ON c."cid" = f."consultantId"
      WHERE f."userId" = ${userId};
    `;

    return result[0] ?? { favorites: [], consultants: [] };
  } catch (e) {
    console.error(e);
    return { favorites: [], consultants: [] };
  }
}

export async function getFavorite(id: string, cid: number) {
  try {
    const favorite = await prisma.favorite.findMany({
      where: {
        userId: id,
        consultantId: cid,
      },
    });

    return favorite.length > 0 ? true : false;
  } catch {
    return false;
  }
}
