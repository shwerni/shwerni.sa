"use server";

import prisma from "@/lib/database/db";
import { Gender, OrderType, PaymentState, Relation } from "@/lib/generated/prisma/enums";
import { orderInfoLabel } from "@/utils";
import { getTaxCommission } from "./admin/settings/finance";

export const getReconciliation = async (oid: number) => {
  const order = await prisma.order.findUnique({
    where: { oid },
    include: {
      payment: true,
      reconciliation: true,
    },
  });
  return order || null;
};

// reserve a new order (meeting) with owner
export const reserveReconciliation = async (
  author: string,
  name: string,
  phone: string,
  description: string,
  otherName: string,
  otherPhone: string,
  otherGender: Gender,
  relation: Relation,
) => {
  try {
    // cid
    const cid = 77;
    const total = 700;

    // get rSettings
    const settings = await getTaxCommission();

    // create new
    const order = await prisma.order.create({
      data: {
        author,
        consultantId: 213,
        name,
        phone,
        description,
        type: OrderType.SCHEDULED,
        reconciliation: {
          create: {
            name: otherName,
            phone: otherPhone,
            gender: otherGender,
            description: description,
            relation,
          },
        },
        payment: {
          create: {
            total: Number(700),
            commission: 60,
            tax: 15,
            payment: PaymentState.NEW,
          },
        },
        info: [
          orderInfoLabel(
            null,
            "new",
            PaymentState.NEW,
            total,
            settings.tax,
            settings.commission,
            name,
            cid,
          ),
        ],
      },
    });
    // return
    return order;
  } catch {
    // return
    return null;
  }
};