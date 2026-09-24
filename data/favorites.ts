"use server";

import prisma from "@/lib/database/db";
import { Consultant } from "@/lib/generated/prisma/client";
import { ConsultantItem } from "./consultant";

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

/**
 * flip favorite state for one consultant
 * @returns true when now favorited, false when removed
 */

export const toggleFavorite = async (userId: string, cid: number) => {
  const existing = await prisma.favorite.findUnique({
    where: { userId_consultantId: { userId, consultantId: cid } },
  });

  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return false;
  }

  try {
    await prisma.favorite.create({ data: { userId, consultantId: cid } });
    return true;
  } catch (e) {
    // lost a create race to a concurrent request, the row exists either way
    if ((e as { code?: string }).code === "P2002") return true;
    throw e;
  }
};

// all consultants the given user has favorited, most recently added first
export const getFavoriteConsultants = async (userId: string) => {
  return prisma.$queryRaw<ConsultantItem[]>`
SELECT
  c.cid,
  c.name,
  c.image,
  c.gender,
  c.category,
  c.rate,
  c.cost30,
  GREATEST(DATE_PART('year', AGE(NOW(), c.seniority))::int, 1) AS years

FROM favorites f
JOIN consultants c ON c.cid = f."consultantId"

WHERE f."userId" = ${userId}
AND c.status = true
AND c."statusA" = 'PUBLISHED'
AND c.approved = 'APPROVED'

ORDER BY f.created_at DESC
`;
};
