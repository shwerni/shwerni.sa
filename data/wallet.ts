"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma types
import { PaymentState, PaymentMethod } from "@/lib/generated/prisma/client";

// hooks
import { onPaymentSuccess } from "@/handlers/admin/order/payment";

// utils
import { totalAfterTax } from "@/utils";
import { dateTimeToString, dateToString } from "@/utils/moment";

// get unique user by phone
export const getWalletByAuthor = async (author: string) => {
  try {
    // get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: author },
    });
    // return
    return wallet;
  } catch {
    return null;
  }
};

// add new transication
export const addWalletCredit = async (
  author: string,
  oid: number,
  total: number,
  tax: number,
) => {
  try {
    // get wallet
    const wallet = await prisma.wallet.findUnique({
      where: { userId: author },
    });
    // final total
    const fTotal = Number(totalAfterTax(total, tax));
    // if not exist
    if (!wallet) {
      // create new wallet
      const newWallet = await prisma.wallet.create({
        data: {
          userId: author,
          status: true,
          credit: total,
          oids: [Number(oid)],
          transactions: [fTotal],
          info: [
            `رقم الطلب #${oid} | نوع العملية: استرداد مبلغ الي المحفظة | الاجمالي غير شامل الضريبة: ${total.toFixed(
              2,
            )} ر.س | ضريبة: ${Number(
              ((total * tax) / 100).toFixed(2),
            )} ر.س | اجمالي: ${fTotal} ر.س | تاريخ الاسترداد: ${dateToString(
              new Date(),
            )}`,
          ],
        },
      });
      // return
      return newWallet;
    }
    // if already oid exist
    const newOids = wallet.oids.includes(Number(oid))
      ? wallet.oids.filter((n) => n !== Number(oid))
      : wallet.oids;

    // create new wallet
    const updateWallet = await prisma.wallet.update({
      where: { userId: author },
      data: {
        credit: wallet.credit + fTotal,
        transactions: { push: [fTotal] },
        oids: newOids,
        info: {
          push: `رقم الطلب #${oid} | نوع العملية: استرداد مبلغ الي المحفظة | الاجمالي غير شامل الضريبة: ${total.toFixed(
            2,
          )} ر.س | ضريبة: ${((total * tax) / 100).toFixed(
            2,
          )} ر.س | اجمالي: ${fTotal} ر.س | تاريخ الاسترداد: ${dateToString(
            new Date(),
          )}`,
        },
      },
    });
    // return
    return updateWallet;
  } catch {
    return null;
  }
};

// update payment pid
export const payAllByWallet = async (
  author: string | undefined,
  oid: number,
  zid: string,
  total: number,
  tax: number,
  pay: number,
) => {
  try {
    // current wallet data
    const wallet = await prisma.wallet.findUnique({
      where: { userId: author },
      select: { credit: true, oids: true },
    });

    // if not exist
    if (!wallet) return null;

    // if oid already exist and used by the wallet
    if (wallet.oids.includes(Number(oid))) return null;

    // wallet
    await prisma.wallet.update({
      where: { userId: author },
      select: { userId: true },
      data: {
        credit: wallet?.credit - Number(pay.toFixed(2)),
        transactions: { push: -Number(pay.toFixed(2)) },
        oids: { push: Number(oid) },
        info: {
          push: `رقم الطلب #${oid} | نوع العملية: سحب مبلغ من المحفظة | الاجمالي غير شامل الضريبة: ${total.toFixed(
            2,
          )} ر.س | ضريبة: ${((total * tax) / 100).toFixed(2)} ر.س | اجمالي: ${(
            total +
            (total * tax) / 100
          ).toFixed(2)} ر.س | تاريخ الاسترداد: ${dateToString(new Date())}`,
        },
      },
    });

    // get order info
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
          push: `#${oid}'s info | paymentId: ${zid} | paymentMethod: ${
            PaymentMethod.wallet
          } | modified_at: ${dateTimeToString(new Date())}`,
        },
      },
      include: {
        meeting: true,
        payment: true,
        consultant: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    // if not exist
    if (!order) return null;

    // if success
    await onPaymentSuccess(order);
    return true;
  } catch {
    return null;
  }
};

// update payment pid
export const requestUsingWallet = async (oid: number, pay: number) => {
  try {
    // get order
    await prisma.order.update({
      where: { oid },
      select: { oid: true },
      data: {
        payment: {
          update: {
            wallet: pay,
          },
        },
        info: {
          push: `#${oid}'s info | partially wallet payemnt: ${pay}`,
        },
      },
    });
    // if success
    return true;
  } catch {
    return null;
  }
};

// update payment pid
export const payPartiallyByWallet = async (
  author: string,
  oid: number,
  total: number,
  tax: number,
  pay: number,
) => {
  try {
    // current wallet data
    const wallet = await prisma.wallet.findUnique({
      where: { userId: author },
      select: { credit: true, oids: true },
    });

    // if not exist
    if (!wallet) return null;

    // wallet
    await prisma.wallet.update({
      where: { userId: author },
      select: { userId: true },
      data: {
        credit: wallet?.credit - Number(pay.toFixed(2)),
        transactions: { push: -Number(pay.toFixed(2)) },
        oids: { push: Number(oid) },
        info: {
          push: `رقم الطلب #${oid} | نوع العملية: سحب مبلغ من المحفظة | الاجمالي غير شامل الضريبة: ${total.toFixed(
            2,
          )} ر.س | ضريبة: ${((total * tax) / 100).toFixed(2)} ر.س | اجمالي: ${(
            total +
            (total * tax) / 100
          ).toFixed(2)} ر.س | تاريخ الاسترداد: ${dateTimeToString(new Date())}`,
        },
      },
    });

    // if success
    return true;
  } catch {
    return null;
  }
};
