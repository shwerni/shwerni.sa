"use server";
// lib
import { sendWhatsappText } from "@/lib/api/whatsapp";

// prisma data
import { upsertWhatsappChat } from "@/data/whatsapp";

export const sendWhatsappChat = async (
  from: string,
  waid: string,
  phone: string,
  name: string,
  text: string
) => {
  try {
    // send text
    await sendWhatsappText(phone, text);
    // store text
    await upsertWhatsappChat(waid, from, name, text);
    // return
    return true;
  } catch {
    // return
    return null;
  }
};
