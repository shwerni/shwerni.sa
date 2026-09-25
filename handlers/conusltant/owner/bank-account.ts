"use server";
// packages
import { z } from "zod";

// schemas
import { BankAccountSchema } from "@/schemas/consultant/iban";

// lib
import { auth } from "@/auth";
import prisma from "@/lib/database/db";
import { checkSaudiIban } from "@/lib/iban";

// save or update the current consultant's bank account
export const saveBankAccount = async (data: z.infer<typeof BankAccountSchema>) => {
  // user is always derived from the session, never from client input
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { state: false, message: "يرجى تسجيل الدخول" };

  // validate
  const parsed = BankAccountSchema.safeParse(data);
  if (!parsed.success) return { state: false, message: "بيانات خاطئة" };

  // normalize + derive bank server-side; client never sends bankCode
  const result = checkSaudiIban(parsed.data.iban);
  if (!result.ok) return { state: false, message: "رقم الآيبان غير صحيح" };

  try {
    // consultant must exist before a bank account can be attached
    const consultant = await prisma.consultant.findUnique({
      where: { userId },
      select: { cid: true },
    });
    if (!consultant) return { state: false, message: "يرجى إنشاء الإعلان أولاً" };

    const bankData = {
      iban: result.iban,
      bankCode: result.bankCode,
      holderName: parsed.data.holderName,
    };

    await prisma.bankAccount.upsert({
      where: { consultantId: consultant.cid },
      create: { consultantId: consultant.cid, ...bankData },
      update: bankData,
    });

    return { state: true, message: "تم حفظ بيانات الحساب البنكي بنجاح" };
  } catch {
    return { state: false, message: "حدث خطأ ما برجاء المحاولة مرة اخري" };
  }
};