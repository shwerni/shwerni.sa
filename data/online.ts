"use server";
// prisma db
import prisma from "@/lib/database/db";
import { timeZone } from "@/lib/site/time";
import {
  ApprovalState,
  Categories,
  ConsultantState,
  Gender,
  OnlineStatus,
} from "@/lib/generated/prisma/enums";
import { pusherServer } from "@/lib/api/pusher/pusher-server";

export const updateOnlineAt = async (author: string, status: OnlineStatus) => {
  try {
    // time
    const { iso } = timeZone();

    // update
    const consultant = await prisma.consultant.update({
      where: { userId: author },
      data: { online_at: iso, online_status: status },
    });

    const activeConsultants = await prisma.consultant.findMany({
      where: { online_status: OnlineStatus.ONLINE },
      select: {
        id: true,
        name: true,
        image: true,
      },
    });

    await pusherServer.trigger(
      "public-consultant-status",
      "consultants-updated",
      activeConsultants,
    );

    return consultant;
  } catch {
    return null;
  }
};

export const getOnlineConsultants = async (ids: string[]) => {
  try {
    // get consultants
    const consultants = await prisma.consultant.findMany({
      where: {
        userId: { in: ids },
        approved: ApprovalState.APPROVED,
        statusA: ConsultantState.PUBLISHED,
        status: true,
      },
    });

    return consultants;
  } catch {
    return [];
  }
};
export type OnlineConsultantPayload = {
  id: string;
  name: string;
  image: string | null;
  gender: Gender;
  category: Categories;
  rate: number;
};
export async function getInitialOnlineConsultants(): Promise<
  OnlineConsultantPayload[]
> {
  return await prisma.consultant.findMany({
    where: { online_status: "ONLINE" },
    select: {
      id: true,
      name: true,
      image: true,
      gender: true,
      category: true,
      rate: true,
    },
  });
}

export const getOnlineConsultant = async (userId: string) => {
  try {
    // get consultants
    const consultant = await prisma.consultant.findUnique({
      where: {
        userId,
        approved: ApprovalState.APPROVED,
        statusA: ConsultantState.PUBLISHED,
        status: true,
      },
      select: {
        cid: true,
      },
    });

    return consultant;
  } catch {
    return null;
  }
};

export async function checkIsAnyConsultantOnline(): Promise<boolean> {
  const count = await prisma.consultant.count({
    where: { online_status: OnlineStatus.ONLINE },
  });
  return count > 0;
}

export async function getOnlineConsultantsList() {
  return await prisma.consultant.findMany({
    where: { online_status: OnlineStatus.ONLINE },
    select: {
      id: true,
      name: true,
      image: true,
      gender: true,
      category: true,
      rate: true,
    },
  });
}

export async function handlePresenceWebhook(userId: string, isOnline: boolean) {
  // Update the single row
  await prisma.consultant.update({
    where: { userId },
    data: {
      online_status: isOnline ? OnlineStatus.ONLINE : OnlineStatus.OFFLINE,
      online_at: isOnline ? new Date() : null,
    },
  });

  // Check if anyone is still online using a cheap COUNT
  const isAnyOnline = await checkIsAnyConsultantOnline();

  // Broadcast ONLY the tiny boolean payload to guests
  await pusherServer.trigger("public-consultant-status", "status-changed", {
    isOnline: isAnyOnline,
  });
}
