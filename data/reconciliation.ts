import "server-only";

// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { Gender, Relation, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { reconciliationFirstMessage } from "@/utils/reconciliation";

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
