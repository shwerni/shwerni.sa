"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import { z } from "zod";
import { subDays } from "date-fns";

// schemas
import { reviewSchema } from "@/schemas/admin";

// utils
import { averageRating } from "@/utils";
import { dateToString } from "@/utils/moment";

// lib
import { aiAcceptReview } from "@/lib/api/ai/ai";

// auth types
import { User } from "next-auth";

// prisma types
import {  PaymentState, ReviewState } from "@/lib/generated/prisma/enums";
import { Consultant } from "@/lib/generated/prisma/client";

// get all rates
export const getAllReviewsDescAdmin = async () => {
  try {
    // get all rates
    const rates = await prisma.review.findMany({
      orderBy: {
        created_at: "desc",
      },
      include: {
        consultant: {
          select: {
            name: true,
          },
        },
      },
    });

    // if not exist
    if (!rates) return null;

    // return rates
    return rates;
  } catch {
    return [];
  }
};

export const getReviewAdmin = async (id: string) => {
  try {
    // get all rates
    const rates = await prisma.review.findUnique({
      where: { id },
    });

    // if not exist
    if (!rates) return null;

    // return rates
    return rates;
  } catch {
    return null;
  }
};

// update a review
export const updateReviewAdmin = async (
  user: User,
  id: string,
  data: z.infer<typeof reviewSchema>,
  owner: Partial<Consultant> | undefined
) => {
  // new data
  const validatedFields = reviewSchema.safeParse(data);

  // will not reach this so no need but keep fo unsuring
  if (!validatedFields || !owner?.cid || !owner?.name)
    return { state: false, message: "something went wrong" };

  try {
    // get review
    const review = await prisma.review.update({
      where: { id },
      data: {
        status: data.status as ReviewState,
        name: data.name,
        author: data.author,
        consultantId: owner.cid,
        comment: data.comment,
        rate: data.rate,
        created_at: new Date(data.date),
        info: {
          push: [
            `rate changed to: ${data.status} by: ${
              user ? user.role + "-" + user.name : "unknown"
            } | modified at ${dateToString(new Date())}`,
          ],
        },
      },
      select: { id: true },
    });

    // update average rates
    await updateAverageRates(owner.cid);
    // return
    return review;
  } catch {
    // return
    return null;
  }
};

// 10 at time
async function processInChunks(
  items: {
    cid: number;
  }[],
  chunkSize: number,
  callback: (
    item: {
      cid: number;
    },
    index: number,
    array: {
      cid: number;
    }[]
  ) => Promise<void>
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    await Promise.all(chunk.map(callback));
  }
}

// update all owners average rates
export const updateAllAverageRates = async () => {
  try {
    // get all ownrers
    const owners = await prisma.consultant.findMany({
      select: { cid: true },
    });

    // if not exist
    if (!owners || owners.length === 0) return null;

    // update rates concurrently
    await processInChunks(owners, 10, async (owner: { cid: number }) => {
      const { cid } = owner;

      // all ownrs's reviews
      const allreview = await prisma.review.findMany({
        where: { consultantId: cid, status: ReviewState.PUBLISHED },
        select: { rate: true },
      });

      // rates array number[]
      const rates = allreview.map((r) => r.rate);
      // calculate average rate
      const average = averageRating(rates);

      // update new rates average
      await prisma.consultant.update({
        where: { cid },
        data: { rate: average },
      });
    });

    // return
    return true;
  } catch {
    // return
    return null;
  }
};

// update average rates by cid
export const updateAverageRates = async (cid: number) => {
  try {
    // get all reviews for this owner
    const allreview = await prisma.review.findMany({
      where: { consultantId: cid, status: ReviewState.PUBLISHED },
      select: { rate: true },
    });
    // rates array
    const rates = allreview.map((r) => r.rate);
    // calculate avarage rate for this cid
    const average = averageRating(rates);
    // save new rates average to this owner
    const newRate = await prisma.consultant.update({
      where: { cid },
      data: { rate: average },
    });
    return Boolean(newRate);
  } catch {
    return null;
  }
};

export const deleteReviewAdmin = async (id: string) => {
  try {
    // delete this review
    const review = await prisma.review.delete({
      where: { id },
    });
    return Boolean(review);
  } catch {
    return null;
  }
};

// recheck review with ai
export const acceptNewreviewAdmin = async (
  date: Date,
  id: string,
  name: string,
  cid: number,
  rate: number,
  comment: string
) => {
  try {
    // five day range
    const fiveDaysRange = subDays(date, 5);

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

    // if ratea above 4 and not comment exist before and there a paid order
    if (rate >= 4 && commentExist < orderExist && orderExist !== 0) {
      // ai model
      const accpeted: { status: boolean; commnet: string | null } =
        await aiAcceptReview(comment, true);

      // post new rate
      await prisma.review.update({
        where: {
          id,
        },
        data: {
          status: accpeted.status ? ReviewState.PUBLISHED : ReviewState.HOLD,
          info: {
            push: [
              `comments: ${commentExist} | orders: ${orderExist} | qualified: ${
                commentExist < orderExist
              } | ${accpeted ? "accepted by Ai" : "refused by Ai"}(${String(
                accpeted
              )}): ${dateToString(new Date())}`,
            ],
          },
        },
      });
      // return
      return true;
    }

    // post new rate
    await prisma.review.update({
      where: {
        id,
      },
      data: {
        info: {
          push: [
            `comments: ${commentExist} | orders: ${orderExist} | not qualified| modified: ${dateToString(
              new Date()
            )}`,
          ],
        },
      },
    });
    // return
    return true;
  } catch {
    return null;
  }
};
