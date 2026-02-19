"use server";
// prisma db
import prisma from "@/lib/database/db";
import { getSetting } from "./admin/settings/settings";
import { timeZone } from "@/lib/site/time";

// get all published coupons
export const getActiveDiscounts = async () => {
  try {
    const discount = await prisma.discount.findMany({
      where: { status: true },
    });
    return discount;
  } catch {
    return null;
  }
};

// get active discount
export const getActiveDiscount = async () => {
  try {
    // get active discount
    const active = await getSetting<number>("discounts", "active");

    // validate
    if (!active) return null;

    // discount
    const discount = await prisma.discount.findUnique({
      where: { did: active },
    });

    // return
    return discount;
  } catch {
    return null;
  }
};

// get all published coupons
export const getDiscountByDid = async (did: number) => {
  try {
    const discount = await prisma.discount.findUnique({
      where: { did },
    });
    return discount;
  } catch {
    return null;
  }
};

export const toggleDiscountState = async (
  did: number,
  status: boolean,
  cid: number,
) => {
  try {
    await prisma.discountConsultant.upsert({
      where: {
        consultantId_discountId: { discountId: did, consultantId: cid },
      },
      update: {
        consultantId: cid,
        status,
      },
      create: {
        discountId: did,
        consultantId: cid,
        status,
      },
    });
    console.log(status);
    return true;
  } catch {
    return null;
  }
};

// get all published coupons
export const getDiscountConsultant = async (did: number, cid: number) => {
  try {
    const discount = await prisma.discountConsultant.findUnique({
      where: {
        consultantId_discountId: {
          discountId: did,
          consultantId: cid,
        },
      },
    });
    return discount;
  } catch {
    return null;
  }
};

// get certain discount
export const applyDiscount = async (user: string, did: number, cid: number) => {
  try {
    // date
    const { iso: now } = timeZone();

    // get discount with consultants
    const discount = await prisma.discount.findUnique({
      where: { did },
    });

    // not found or inactive
    if (!discount || !discount.status || !discount.visibility) {
      return { state: false, message: "هذا الخصم غير متاح حالياً." };
    }

    // check if discount is linked to this consultant
    const isLinked = await prisma.discountConsultant.findUnique({
      where: {
        consultantId_discountId: { discountId: did, consultantId: cid },
      },
    });

    if (!isLinked) {
      return { state: false, message: "هذا الخصم غير مخصص لهذا المستشار." };
    }

    if (discount.startDate && now < discount.startDate) {
      return { state: false, message: "الخصم لم يبدأ بعد." };
    }

    if (discount.endDate && now > discount.endDate) {
      return { state: false, message: "انتهت صلاحية الخصم." };
    }

    // guest user restriction (if limit is set)
    if (user === "temp" && discount.limit !== null) {
      return {
        state: false,
        message: "يجب تسجيل الدخول لاستخدام هذا الخصم.",
      };
    }

    // user usage count
    const userUsageCount = discount.users.filter((u) => u === user).length;

    if (discount.limit !== null && userUsageCount >= discount.limit) {
      return {
        state: false,
        message: "لقد استخدمت الحد المسموح به من هذا الخصم.",
      };
    }

    return {
      state: true,
      discount: discount.discount,
      did: discount.did,
      message: "تم تطبيق الخصم",
    };
  } catch {
    return { state: false, message: "الخصم غير صالح." };
  }
};
