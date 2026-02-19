"use server";
// prisma db
import prisma from "@/lib/database/db";

// packages
import moment from "moment";

// prisma types
import { PaymentState } from "@/lib/generated/prisma/enums";

// types
import { GroupedDues } from "@/types/types";

// utils
import { calculateDues } from "@/utils/admin/dues";

// get collaborator
export async function getCollaboratorById(id: string) {
  try {
    // get collaborator
    const collaborator = await prisma.collaboration.findUnique({
      where: {
        id,
      },
    });

    // return
    return collaborator;
  } catch {
    // return
    return null;
  }
}

// get collaborator
export async function getCollaboratorByAuthor(userId: string) {
  try {
    // get collaborator
    const collaborator = await prisma.collaboration.findUnique({
      where: {
        userId,
      },
    });

    // return
    return collaborator;
  } catch {
    // return
    return null;
  }
}

// get orders
export async function getOrdersForCollaboration(
  collaboratorId: string,
  page: number,
  search: string
) {
  const limit = 10;
  const skip = (page - 1) * limit;

  let where: any = { collaboratorId };

  // handle search
  if (search?.trim()) {
    if (search.startsWith("#")) {
      const oid = parseInt(search.slice(1).trim());
      if (!isNaN(oid)) {
        where = { ...where, oid };
      }
    } else {
      where = {
        ...where,
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          {
            consultant: {
              is: {
                name: { contains: search, mode: "insensitive" },
              },
            },
          },
        ],
      };
    }
  }

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        consultant: { select: { name: true, phone: true } },
        payment: { select: { payment: true, total: true } },
        meeting: { select: { session: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
  };
}

// dues
export const getTotalDuesCollaboratorByMonth = async (
  collaboratorId: string,
  range: string
) => {
  try {
    const pDate = moment(range, "MM-YYYY");
    const startDate = pDate.startOf("month").toDate();
    const endDate = pDate.endOf("month").toDate();

    const dues = await prisma.order.findMany({
      where: {
        collaboratorId,
        payment: {
          payment: PaymentState.PAID,
        },
        due_at: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: {
        consultantId: true,
        consultant: true,
        payment: {
          include: {
            usedCoupon: true,
          },
        },
      },
    });

    // results
    const groupedOrders = dues.reduce(
      (acc: { [key: number]: GroupedDues }, order) => {
        const payment = order.payment!;

        const duesCalc = calculateDues({
          total: payment.total,
          commission: payment.commission,
          coupon: payment.usedCoupon
            ? {
                discount: payment.usedCoupon.discount,
                type: payment.usedCoupon.type,
              }
            : undefined,
        });

        if (!acc[order.consultantId]) {
          acc[order.consultantId] = {
            cid: order.consultantId,
            consultant: order.consultant.name,
            total: 0,
            count: 0,
            finalTotal: 0,
          };
        }

        acc[order.consultantId].total += payment.total;
        acc[order.consultantId].count += 1;
        acc[order.consultantId].finalTotal += duesCalc.platformEarning;

        return acc;
      },
      {}
    );

    const groupedArray = Object.entries(groupedOrders).map(([cid, data]) => ({
      cid: Number(cid),
      consultant: data.consultant,
      total: data.total,
      count: data.count,
      finalTotal: data.finalTotal,
    }));

    const cids = groupedArray.map((g) => g.cid);

    const consultants = await prisma.consultant.findMany({
      where: { cid: { in: cids } },
      select: { cid: true, iban: true, bankName: true },
    });

    const consultantMap: { [key: number]: Partial<GroupedDues> } = {};
    consultants.forEach((co) => {
      consultantMap[co.cid] = {
        cid: co.cid,
        iban: co.iban ?? "",
        bankName: co.bankName ?? "",
      };
    });

    const result: GroupedDues[] = groupedArray.map((g) => ({
      ...g,
      iban: consultantMap[g.cid]?.iban,
      bankName: consultantMap[g.cid]?.bankName,
    }));

    return result;
  } catch {
    return null;
  }
};

export async function upsertCollaboration(
  userId: string,
  name: string,
  image: string
) {
  try {
    const collaboration = await prisma.collaboration.upsert({
      where: { userId },
      update: {
        name,
        image,
      },
      create: {
        name,
        image,
        userId,
        commission: 50,
      },
    });
    return collaboration;
  } catch {
    // return;
    return null;
  }
}
