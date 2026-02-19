"use server";
import { nanoid } from "nanoid";
import { checkBotLimit } from "@/data/admin/bot";
import { upsertWhatsappChat } from "@/data/whatsapp";
import { handleBotReply } from "./bot";
import { Consultant } from "@/lib/generated/prisma/client";
import { User } from "next-auth";

export async function SendChatBot(
  message: string,
  user?: User,
  consultant?: Pick<Consultant, "name" | "cid" | "gender">,
) {
  // from
  const from = user?.phone || `guest-${nanoid(7)}`;

  // name
  const name = consultant?.name || user?.name || "مستخدم مجهول";

  // allowed
  const allowed = await checkBotLimit(from);

  // store in database
  await upsertWhatsappChat(from, from, name, message);

  // validate
  if (!allowed) {
    // store in database
    await upsertWhatsappChat(
      from,
      "966553689116",
      name,
      `❌ لقد وصلت إلى الحد الأقصى لعدد الرسائل اليوم. حاول مرة أخرى غدًا./nالدعم الفني: https://wa.me/966554117879`,
    );

    // return false
    return `❌ لقد وصلت إلى الحد الأقصى لعدد الرسائل اليوم. حاول مرة أخرى غدًا./nالدعم الفني: https://wa.me/966554117879`;
  }

  // customer bot
  const reply = await handleBotReply(from, message, user, name);

  return reply;
}
