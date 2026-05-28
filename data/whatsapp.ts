"use server";
// prisma data
import prisma from "@/lib/database/db";
import { timeZone } from "@/lib/site/time";

// lib

// upsert whatsapp message
export async function upsertWhatsappChat(
  waid: string,
  phone: string,
  name: string,
  content: string,
) {
  try {
    // time now
    const { iso: originDate } = timeZone();

    await prisma.waChat.upsert({
      where: { waid },
      update: {
        name,
        last_message_at: originDate,
      },
      create: {
        waid,
        phone,
        name,
        last_message_at: originDate,
      },
      include: { messages: true },
    });

    await prisma.message.create({
      data: {
        chatId: waid,
        time: originDate,
        content,
        from: phone,
      },
    });

    // return
    return true;
  } catch {
    // return
    return null;
  }
}

// get chat message
export async function getWhatsappContact() {
  try {
    const chat = await prisma.waChat.findMany({
      select: {
        phone: true,
        name: true,
        waid: true,
      },
      orderBy: {
        updated_at: "asc",
      },
    });

    // validate
    if (!chat) return null;

    // return
    return chat;
  } catch {
    return null;
  }
}

// get chat message
export async function getWhatsappChat(waid: string) {
  try {
    // chat
    const chat = await prisma.message.findMany({
      where: { chatId: waid },
      orderBy: { time: "asc" },
    });

    // validate
    if (!chat) return null;

    // return
    return chat;
  } catch {
    return null;
  }
}
