"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import { subDays } from "date-fns";

// prsima types
import { PaymentState, Review, ReviewState } from "@/lib/generated/prisma/client";

// utils
import { dateToString } from "@/utils/moment";

// lib
import { aiAcceptReview } from "@/lib/api/ai/ai";

// if rate exist to prevent second review
export const reviewsExistByAuthor = async (author: string, cid: number) => {
  try {
    // if this author has review
    const review = await prisma.review.findMany({
      where: { author, consultantId: cid },
    });
    // return
    return Boolean(review);
  } catch (error) {
    return false;
  }
};

// if rate exist to prevent second review
export const reviewIsReservedByAuthor = async (author: string, cid: number) => {
  try {
    // if this author has review
    const review = await prisma.order.findFirst({
      where: { author, consultantId: cid },
    });
    // return
    return Boolean(review);
  } catch (error) {
    return false;
  }
};

// get owners current count & increment on it
export const getreviewsByAuthor = async (cid: number) => {
  try {
    // get all settings
    const review = await prisma.review.findMany({
      where: { consultantId: cid, status: ReviewState.PUBLISHED },
    });
    // return
    return review;
  } catch (error) {
    return null;
  }
};

// get owners current count & increment on it
export const getReviewsForHome = async () => {
  try {
    // review
    const reviews = await prisma.$queryRaw<(Review & { consultant: string })[]>`
      SELECT 
        r.*, 
        c.name AS "consultant"
      FROM "reviews" r
      JOIN "consultants" c ON r."consultantId" = c."cid"
      WHERE r.status::text = ${ReviewState.PUBLISHED}
        AND r.rate > 4
      ORDER BY RANDOM()
      LIMIT 10
    `;
    // return
    return reviews;
  } catch {
    return null;
  }
};

// get owners current count & increment on it
export const postreview = async (
  cid: number,
  author: string,
  name: string,
  comment: string,
  rate: number
) => {
  try {
    // post new rate
    const review = await prisma.review.create({
      data: {
        consultantId: cid,
        author,
        name,
        comment,
        rate,
        status: ReviewState.HOLD,
      },
    });

    // return
    return Boolean(review);
  } catch {
    return null;
  }
};

// accept new reviews
export const acceptNewreview = async (
  cid: number,
  owner: string,
  author: string,
  name: string,
  comment: string,
  rate: number
) => {
  try {
    // five day range
    const fiveDaysRange = subDays(new Date(), 10);

    // is this comment exist
    const commentExist = await prisma.review.count({
      where: {
        consultantId: cid,
        name,
        status: ReviewState.PUBLISHED,
        created_at: { gte: fiveDaysRange },
      },
    });

    // is there a paid order in the range
    const orderExist = await prisma.order.count({
      where: {
        name: { contains: name, mode: "insensitive" },
        consultantId: cid,
        payment: { payment: PaymentState.PAID },
        created_at: { gte: fiveDaysRange },
      },
    });

    // is there a paid order in the range
    const freeExist = await prisma.freeSession.count({
      where: {
        name: { contains: name, mode: "insensitive" },
        consultantId: cid,
        created_at: { gte: fiveDaysRange },
      },
    });

    // count of exist services
    const servicesExist = orderExist + freeExist;

    // if ratea above 4 and not comment exist before and there a paid order
    if (rate >= 4 && commentExist < servicesExist && servicesExist !== 0) {
      // ai model
      const accepted: { status: boolean; commnet: string | null } =
        await aiAcceptReview(comment, true);

      // post new rate
      await prisma.review.create({
        data: {
          consultantId: cid,
          author,
          name,
          comment: accepted.commnet ? accepted.commnet : comment,
          rate,
          verified: accepted.status ? true : false,
          status: accepted.status ? ReviewState.PUBLISHED : ReviewState.HOLD,
          info: [
            `comments: ${commentExist} | orders: ${orderExist} | freesession: ${servicesExist} | qualified: ${
              commentExist < servicesExist
            } | ${
              accepted.status ? "accepted by Ai" : "refused by Ai"
            }(${String(accepted.status)}): ${dateToString(new Date())}`,
          ],
        },
      });
      // return
      return true;
    }

    // post new rate
    await prisma.review.create({
      data: {
        consultantId: cid,
        author,
        name,
        comment,
        rate,
        status: ReviewState.HOLD,
        info: [
          `comments: ${commentExist} | orders: ${orderExist} | freesession: ${servicesExist} | not qualified| modified: ${dateToString(
            new Date()
          )}`,
        ],
      },
    });
    // return
    return true;
  } catch {
    return null;
  }
};

// get consultant reviews
export async function getReviewsForConsultant(page: number = 1) {
  const limit = 10;
  const skip = (page - 1) * limit;

  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      skip,
      take: limit,
      include: {
        consultant: { select: { name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.review.count(),
  ]);

  return {
    reviews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}