// packages
import prisma from "@/lib/database/db";
import { WalletTransactionType } from "@/lib/generated/prisma/client";

const USER_ID = "cly5ogods000213tvxcg76de5";

async function main() {
  const wallet = await prisma.wallet.upsert({
    where: { userId: USER_ID },
    create: { userId: USER_ID, credit: 0 },
    update: {},
  });

  // wipe any previous preview transactions for a clean rerun
  await prisma.walletTransaction.deleteMany({ where: { walletId: wallet.id } });

  const events: {
    type: WalletTransactionType;
    amount: number;
    orderId: number;
    description: string;
  }[] = [
    {
      type: WalletTransactionType.REFUND,
      amount: 345,
      orderId: 6007,
      description:
        "رقم الطلب #6007 | نوع العملية: استرداد مبلغ إلى المحفظة | الاجمالي غير شامل الضريبة: 300.00 ر.س | ضريبة: 45.00 ر.س | اجمالي: 345.00 ر.س | تاريخ العملية: 2025-06-16 15:27:37",
    },
    {
      type: WalletTransactionType.PAYMENT,
      amount: 115,
      orderId: 6650,
      description:
        "رقم الطلب #6650 | نوع العملية: سحب مبلغ من المحفظة | الاجمالي غير شامل الضريبة: 100.00 ر.س | ضريبة: 15.00 ر.س | اجمالي: 115.00 ر.س | تاريخ العملية: 2025-07-11 11:20:23",
    },
    {
      type: WalletTransactionType.PARTIAL_PAYMENT,
      amount: 50,
      orderId: 6808,
      description:
        "رقم الطلب #6808 | نوع العملية: سحب جزئي من المحفظة | الاجمالي غير شامل الضريبة: 99.00 ر.س | ضريبة: 14.85 ر.س | اجمالي: 113.85 ر.س | تاريخ العملية: 2025-07-16 10:08:22",
    },
  ];

  let balance = 0;
  for (const e of events) {
    const signed =
      e.type === WalletTransactionType.REFUND ? e.amount : -e.amount;
    balance += signed;

    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: e.type,
        amount: e.amount,
        balanceAfter: balance,
        orderId: e.orderId,
        description: e.description,
      },
    });
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { credit: balance },
  });

  console.log(`wallet ${wallet.id} seeded, final balance: ${balance}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
