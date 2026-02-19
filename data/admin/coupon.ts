"use server";
// prisma db
import prisma from "@/lib/database/db";

// get unique user by email
export const getAllCoupons = async () => {
  try {
    const exist = await prisma.coupon.findMany({
      orderBy: [
        {
          created_at: "desc",
        },
      ],
    });
    return exist;
  } catch {
    return null;
  }
};
