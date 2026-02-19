// prima types
import { Consultant } from "@/lib/generated/prisma/client";

// lib
import { telegramCService } from "@/lib/api/telegram/telegram";
import { notificationNewOwner } from "@/lib/notifications";

// on owner approval
export const onOwnerApproval = async (owner: Consultant) => {
  // send whatsapp notify
  await notificationNewOwner(
    owner.phone ?? "",
    owner.name ?? "",
    String(owner.cid)
  );
  // send telegram notify
  await telegramCService(
    `مستشار جديد بالمصنة\nالاسم:${owner.name}\nرقم الهاتف: ${owner.phone}\nرابط التواصل معه علي الواتس اب: https://wa.me/${owner.phone}\n:رابط اعلانه: https://shwerni.sa/consultant/${owner.cid}`
  );
};
