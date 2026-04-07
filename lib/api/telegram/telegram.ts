"use server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/client";

// prisma data
import { getServiceTelegramIds } from "@/data/admin/settings/employee";

// types
import { Reservation } from "@/types/admin";

// telegram templates
import {
  adminTelegramNewOrder,
  managerTelegramNewOrder,
  serviceTelegramNewOrder,
} from "./templates";

// telegram api base
const TELEGRAM_URL = `https://api.telegram.org/bot${process.env.TELEGRAM_APIKEY}`;

// telegram fetch helper
const telegramFetch = (method: string, body: object) =>
  fetch(`${TELEGRAM_URL}/${method}`, {
    method: "POST",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

// send message helper
const sendMessage = (chat_id: string, text: string) =>
  telegramFetch("sendMessage", { chat_id, text });

// send document helper
const sendDocument = (chat_id: string, document: string) =>
  telegramFetch("sendDocument", { chat_id, document });

// infom me & inform manager 966554117879 or 201014203964
export const newOrdertelegram = async (data: Reservation) => {
  try {
    // notify admins
    const admins = await getServiceTelegramIds(UserRole.ADMIN);

    // service
    const services = await getServiceTelegramIds(UserRole.SERVICE);

    // manager
    const managers = await getServiceTelegramIds(UserRole.MANAGER);

    // notify admins
    await Promise.allSettled(
      admins.map((admin) => sendMessage(String(admin), adminTelegramNewOrder(data)))
    );

    // notify services
    await Promise.allSettled(
      services.map((service) => sendMessage(String(service), serviceTelegramNewOrder(data)))
    );

    // notify managers
    await Promise.allSettled(
      managers.map((manager) => sendMessage(String(manager), managerTelegramNewOrder(data)))
    );

    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// infom me & inform manager 966554117879 or 201014203964
export const telegramRefund = async (data: Reservation) => {
  try {
    // notify me telegram
    await telegram(
      `ziad abolmajd\na shwerni's order has refunded \n\norderNo: ${data.oid}\nname: ${data.name}\nconsultant: ${data.consultant}\nprice: ${data.payment?.total}\nphone:${data.phone}`
    );
    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// notification orders
export const telegram = async (data: string) => {
  try {
    // notify me telegram
    await sendMessage("1744134911", data);
    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// notify customer service telegram
export const telegramCService = async (data: string) => {
  try {
    // notify me telegram
    await sendMessage("5421775862", data);
    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// zadmin notification
export const telegramAdmin = async (data: string) => {
  try {
    // notify me telegram
    await sendMessage("1065815464", data);
    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// notify reviewer telegram
export const telegramEmployees = async (to: string, data: string) => {
  try {
    // notify me telegram
    await sendMessage(to, data);
    // return
    return true;
  } catch {
    // return
    return false;
  }
};

// pdf documents notification
export const telegramDocuments = async (to: string, url: string) => {
  try {
    // notify me telegram
    await sendDocument(to, url);
    // return
    return true;
  } catch {
    // return
    return false;
  }
};