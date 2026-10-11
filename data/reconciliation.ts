import "server-only";

import prisma from "@/lib/database/db";
import {
  Gender,
  OrderType,
  PaymentState,
  Relation,
  UserRole,
} from "@/lib/generated/prisma/enums";
import { orderInfoLabel } from "@/utils";
import { getTaxCommission } from "./admin/settings/finance";
import { reconciliationFirstMessage } from "@/utils/reconciliation";

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

    // if (description && description.trim().length > 0)
    //   await prisma.orderMessage.create({
    //     data: {
    //       content: description.trim(),
    //       sender: UserRole.USER,
    //       orderId: order.oid,
    //       meetingId: order.meeting[0].mid,
    //     },
    //   });

    // return
    return order;
  } catch {
    // return
    return null;
  }
};

// ---------- the rebuilt booking (normal booking path) ----------

// links a new reconciliation order to its other party and posts the consultant's brief as the
// session chat's first client message (the other party's name, relation and gender, then the
// description; never their phone, which stays on this row for the admin team). one transaction.
// called after reserveConsultant created the order and its meeting; false on failure, so the
// caller stops before the gateway and the NEW order is left to the cancel-orders cron
export const attachReconciliation = async (
  order: { id: string; oid: number; mid: string },
  input: {
    otherName: string;
    otherPhone: string;
    relation: Relation;
    gender: Gender;
    description: string;
  },
) => {
  try {
    await prisma.$transaction([
      prisma.reconciliation.create({
        data: {
          orderId: order.id,
          name: input.otherName,
          phone: input.otherPhone,
          relation: input.relation,
          gender: input.gender,
          description: input.description,
        },
      }),
      prisma.orderMessage.create({
        data: {
          orderId: order.oid,
          meetingId: order.mid,
          sender: UserRole.USER,
          content: reconciliationFirstMessage(input),
        },
      }),
    ]);
    return true;
  } catch (err) {
    console.error(
      `[reconciliation] attach failed oid=${order.oid}`,
      err instanceof Error ? err.name : "error",
    );
    return false;
  }
};

// is this order a reconciliation booking (its Reconciliation row is the marker: admin, finance
// and the success page's conversion marker)
export const isReconciliationOrder = async (oid: number) => {
  try {
    return !!(await prisma.reconciliation.findFirst({
      where: { order: { oid } },
      select: { id: true },
    }));
  } catch {
    return false;
  }
};
