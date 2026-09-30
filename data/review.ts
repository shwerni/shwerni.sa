import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// packages
import { subDays } from "date-fns";

// prsima types
import {
  PaymentState,
  Review,
  ReviewState,
} from "@/lib/generated/prisma/client";

// utils
import { riyadhDateString } from "@/utils/date";

// lib
import { aiAcceptReview } from "@/lib/api/ai/ai";

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

// accept new reviews
export const acceptNewreview = async (
  cid: number,
  owner: string,
  author: string,
  name: string,
  comment: string,
  rate: number,
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
      const accepted: { status: boolean; comment: string | null } =
        await aiAcceptReview(comment, true);

      // post new rate
      await prisma.review.create({
        data: {
          consultantId: cid,
          author,
          name,
          comment: accepted.comment ? accepted.comment : comment,
          rate,
          verified: accepted.status ? true : false,
          status: accepted.status ? ReviewState.PUBLISHED : ReviewState.HOLD,
          info: [
            `comments: ${commentExist} | orders: ${orderExist} | freesession: ${servicesExist} | qualified: ${
              commentExist < servicesExist
            } | ${
              accepted.status ? "accepted by Ai" : "refused by Ai"
            }(${String(accepted.status)}): ${riyadhDateString(new Date())}`,
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
          `comments: ${commentExist} | orders: ${orderExist} | freesession: ${servicesExist} | not qualified| modified: ${riyadhDateString(
            new Date(),
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

  // approved reviews only, and only the fields the dashboard page renders
  const [reviews, totalCount] = await Promise.all([
    prisma.review.findMany({
      where: { status: ReviewState.PUBLISHED },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        comment: true,
        rate: true,
        status: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.review.count({ where: { status: ReviewState.PUBLISHED } }),
  ]);

  return {
    reviews,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// accept review whatsapp
export const acceptWhatsappReview = async (
  oid: number,
  name: string,
  phone: string,
  rate: number,
  comment: string,
) => {
  try {
    // get cid
    const consultant = await prisma.order.findUnique({
      where: { oid },
      select: { consultantId: true },
    });

    // get user if exist
    const user = await prisma.user.findUnique({
      where: { phone },
      select: { id: true },
    });

    // validate
    if (!consultant) return false;

    // if rate above 4
    if (rate >= 4) {
      // ai model
      const accepted: { status: boolean; comment: string | null } =
        await aiAcceptReview(comment, true);

      // post new rate
      await prisma.review.create({
        data: {
          consultantId: consultant.consultantId,
          author: user?.id || "temp",
          name,
          comment: accepted.comment ? accepted.comment : comment,
          rate,
          verified: accepted.status ? true : false,
          status: accepted.status ? ReviewState.PUBLISHED : ReviewState.HOLD,
          info: [
            `order: #${oid} | ${
              accepted.status ? "accepted by Ai" : "refused by Ai"
            }(${String(accepted.status)}): ${riyadhDateString(new Date())}`,
          ],
        },
      });
      // return
      return true;
    }

    // post new rate
    await prisma.review.create({
      data: {
        consultantId: consultant.consultantId,
        author: user?.id || "temp",
        name,
        comment,
        rate,
        status: ReviewState.HOLD,
        info: [
          `order: #${oid} | not qualified| modified: ${riyadhDateString(
            new Date(),
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

interface ReviewsPage {
  reviews: Review[];
  nextCursor: string | null;
}

// paginated reviews for a consultant, newest first, cursor = last review id
export const getConsultantPaginatedReviews = async (
  cid: number,
  cursor: string | null,
  limit: number,
): Promise<ReviewsPage> => {
  try {
    const reviews = await prisma.review.findMany({
      where: { consultantId: cid, status: ReviewState.PUBLISHED },
      orderBy: { created_at: "desc" },
      take: limit + 1,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    const hasMore = reviews.length > limit;
    const page = hasMore ? reviews.slice(0, limit) : reviews;

    return {
      reviews: page,
      nextCursor: hasMore ? page[page.length - 1].id : null,
    };
  } catch {
    return { reviews: [], nextCursor: null };
  }
};