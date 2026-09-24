"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import {
  PaymentState,
  PaymentMethod,
  WalletTransactionType,
} from "@/lib/generated/prisma/client";

// hooks
import { onPaymentSuccess } from "@/handlers/admin/order/payment";

// utils
import { totalAfterTax } from "@/utils";
import { dateTimeToString } from "@/utils/time";

// arabic description for a transaction, one place so every writer matches
const describe = (
  oid: number,
  label: string,
  total: number,
  tax: number,
  fTotal: number,
) =>
  `رقم الطلب #${oid} | نوع العملية: ${label} | الاجمالي غير شامل الضريبة: ${total.toFixed(2)} ر.س | ضريبة: ${((total * tax) / 100).toFixed(2)} ر.س | اجمالي: ${fTotal.toFixed(2)} ر.س | تاريخ العملية: ${dateTimeToString(new Date())}`;

// get wallet by user id
export const getWalletByAuthor = async (author: string) => {
  try {
    return await prisma.wallet.findUnique({ where: { userId: author } });
  } catch {
    return null;
  }
};

/**
 * refund an order's amount into the user's wallet
 * creates the wallet on first use, idempotent per order — retrying
 * the same refund never double-credits
 */
export const addWalletCredit = async (
  author: string,
  oid: number,
  total: number,
  tax: number,
) => {
  const fTotal = Number(totalAfterTax(total, tax));

  try {
    return await prisma.$transaction(async (tx) => {
      const already = await tx.walletTransaction.findFirst({
        where: {
          orderId: oid,
          type: WalletTransactionType.REFUND,
          wallet: { userId: author },
        },
      });
      if (already) return null;

      const wallet = await tx.wallet.upsert({
        where: { userId: author },
        create: { userId: author, credit: fTotal },
        update: { credit: { increment: fTotal } },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.REFUND,
          amount: fTotal,
          balanceAfter: wallet.credit,
          orderId: oid,
          description: describe(
            oid,
            "استرداد مبلغ إلى المحفظة",
            total,
            tax,
            fTotal,
          ),
        },
      });

      return wallet;
    });
  } catch {
    return null;
  }
};

/**
 * pay an order fully using wallet credit
 * atomic compare-and-swap: the balance check and the debit happen in one
 * conditional update, so two concurrent requests can't both succeed
 * against the same starting balance
 */
export const payAllByWallet = async (
  author: string | undefined,
  oid: number,
  zid: string,
  total: number,
  tax: number,
  pay: number,
) => {
  if (!author) return null;
  const amount = Number(pay.toFixed(2));

  try {
    const debited = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: author } });
      if (!wallet) return null;

      const already = await tx.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          orderId: oid,
          type: {
            in: [
              WalletTransactionType.PAYMENT,
              WalletTransactionType.PARTIAL_PAYMENT,
            ],
          },
        },
      });
      if (already) return null;

      // only debits if enough balance exists at the moment of the write,
      // not at the moment we read it above
      const result = await tx.wallet.updateMany({
        where: { id: wallet.id, credit: { gte: amount } },
        data: { credit: { decrement: amount } },
      });
      if (result.count === 0) return null; // insufficient balance

      const updated = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.PAYMENT,
          amount,
          balanceAfter: updated.credit,
          orderId: oid,
          description: describe(
            oid,
            "سحب مبلغ من المحفظة",
            total,
            tax,
            total + (total * tax) / 100,
          ),
        },
      });

      return true;
    });

    if (!debited) return null;

    const order = await prisma.order.update({
      where: { oid },
      data: {
        payment: {
          update: {
            pid: zid,
            method: PaymentMethod.wallet,
            payment: PaymentState.PAID,
          },
        },
        info: {
          push: `#${oid}'s info | paymentId: ${zid} | paymentMethod: ${PaymentMethod.wallet} | modified_at: ${dateTimeToString(new Date())}`,
        },
      },
      include: {
        meeting: { include: { participants: true } },
        payment: true,
        consultant: { select: { userId: true, name: true, phone: true } },
      },
    });

    if (!order) return null;

    await onPaymentSuccess(order);
    return true;
  } catch {
    return null;
  }
};

// record the intended partial-wallet amount on the order's payment, before the actual charge
export const requestUsingWallet = async (oid: number, pay: number) => {
  try {
    await prisma.order.update({
      where: { oid },
      select: { oid: true },
      data: {
        payment: { update: { wallet: pay } },
        info: { push: `#${oid}'s info | partially wallet payment: ${pay}` },
      },
    });
    return true;
  } catch {
    return null;
  }
};

/**
 * pay part of an order using wallet credit
 * same atomic compare-and-swap as payAllByWallet
 *
 * NOTE: kept identical to the original — this does not update the order's
 * payment status or call onPaymentSuccess. The original never did either,
 * which implies the remaining balance (paid by another method) is what
 * finalizes the order elsewhere. Confirm that's still true before relying
 * on this in production; if partial-wallet payments should also finalize
 * immediately, this needs the same order-update block as payAllByWallet.
 */
export const payPartiallyByWallet = async (
  author: string,
  oid: number,
  total: number,
  tax: number,
  pay: number,
) => {
  const amount = Number(pay.toFixed(2));

  try {
    const debited = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.findUnique({ where: { userId: author } });
      if (!wallet) return null;

      const already = await tx.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          orderId: oid,
          type: {
            in: [
              WalletTransactionType.PAYMENT,
              WalletTransactionType.PARTIAL_PAYMENT,
            ],
          },
        },
      });
      if (already) return null;

      const result = await tx.wallet.updateMany({
        where: { id: wallet.id, credit: { gte: amount } },
        data: { credit: { decrement: amount } },
      });
      if (result.count === 0) return null;

      const updated = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType.PARTIAL_PAYMENT,
          amount,
          balanceAfter: updated.credit,
          orderId: oid,
          description: describe(
            oid,
            "سحب جزئي من المحفظة",
            total,
            tax,
            total + (total * tax) / 100,
          ),
        },
      });

      return true;
    });

    return debited ?? null;
  } catch {
    return null;
  }
};

/**
 * manual balance adjustment by an admin — the schema supports this
 * (ADJUSTMENT_CREDIT/ADJUSTMENT_DEBIT) but no writer existed for it before
 * @param amount always positive, direction comes from type
 * @param reason shown in the wallet history in place of an order description
 */
export const adjustWalletCredit = async (
  userId: string,
  amount: number,
  type: "ADJUSTMENT_CREDIT" | "ADJUSTMENT_DEBIT",
  reason: string,
) => {
  const signed = type === "ADJUSTMENT_CREDIT" ? amount : -amount;

  try {
    return await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: { userId, credit: Math.max(signed, 0) },
        update: {},
      });

      if (type === "ADJUSTMENT_DEBIT") {
        const result = await tx.wallet.updateMany({
          where: { id: wallet.id, credit: { gte: amount } },
          data: { credit: { decrement: amount } },
        });
        if (result.count === 0) return null; // insufficient balance
      } else if (wallet.credit !== signed) {
        // only increment when the upsert didn't just create it with this exact value
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { credit: { increment: signed } },
        });
      }

      const updated = await tx.wallet.findUniqueOrThrow({
        where: { id: wallet.id },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: WalletTransactionType[type],
          amount,
          balanceAfter: updated.credit,
          description: reason,
        },
      });

      return updated;
    });
  } catch {
    return null;
  }
};

// paginated wallet history for a user, newest first
export const getWalletTransactions = async (
  userId: string,
  page = 1,
  pageSize = 20,
) => {
  try {
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      select: { id: true },
    });
    if (!wallet) return { items: [], hasMore: false };

    const items = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { items, hasMore: items.length === pageSize };
  } catch {
    return { items: [], hasMore: false };
  }
};
