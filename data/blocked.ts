"use server";
import prisma from "@/lib/database/db";

export async function CheckIsBlocked(phone: string) {
  const blocked = await prisma.blocked.findUnique({
    where: { phone },
  });

  if (blocked) {
    return true;
    return {
      error: "عذراً، لا يمكن إتمام العملية لهذا الرقم في الوقت الحالي.",
    };
  }

  // not blocked
  return null;
}
