"use server";
// prisma db
import prisma from "@/lib/database/db";

// prisma prisma
import { PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// get unique user by phone
export const getUserLogin = async (phone: string, administrator: boolean) => {
  try {
    // get public user
    const user = administrator
      ? await prisma.user.findFirst({
          where: {
            phone,
            role: {
              notIn: [UserRole.USER, UserRole.OWNER],
            },
          },
        })
      : await prisma.user.findFirst({
          where: {
            phone,
            role: {
              in: [UserRole.USER, UserRole.OWNER],
            },
          },
        });
    return user;
  } catch {
    return null;
  }
};

// get unique user by phone
export const getUserByPhone = async (phone: string) => {
  try {
    const exist = await prisma.user.findUnique({ where: { phone } });
    return exist;
  } catch {
    return null;
  }
};

// get unique user by Id
export const getUserById = async (id: string) => {
  try {
    const exist = await prisma.user.findUnique({ where: { id } });
    // if not exist
    if (!exist) return null;
    // return
    return exist;
  } catch {
    return null;
  }
};

// get unique user by Id
export const getUsersByRole = async (role: UserRole) => {
  try {
    const exist = await prisma.user.findMany({ where: { role } });
    // if not exist
    if (!exist) return null;
    return exist;
  } catch {
    return null;
  }
};

// get unique user by email
export const getUserByEmail = async (email: string) => {
  try {
    const exist = await prisma.user.findUnique({
      where: { email },
      select: { email: true },
    });
    return exist;
  } catch {
    return null;
  }
};

// get unique user by email
export const getAllUsers = async () => {
  try {
    const exist = await prisma.user.findMany();
    return exist;
  } catch {
    return null;
  }
};

// createUser register
export const createUser = async (
  role: UserRole,
  username: string,
  email: string | undefined,
  phone: string,
  password: string
) => {
  try {
    await prisma.user.create({
      data: { name: username, email, phone, role, password },
    });
    return true;
  } catch {
    return null;
  }
};

type OrderFilter = {
  userId: string;
  type?: "upcoming" | "past" | "all";
  paymentState?: string;
};

export async function getUserOrders({
  userId,
  type,
  paymentState,
}: OrderFilter) {
  const now = new Date();

  return prisma.order.findMany({
    where: {
      author: userId,

      // upcoming / past filter (skip if type is "all" or empty)
      ...(type && type !== "all"
        ? type === "upcoming"
          ? { due_at: { gte: now } }
          : { due_at: { lt: now } }
        : {}),

      // payment state filter (skip if paymentState is "all" or empty)
      ...(paymentState && paymentState !== "all"
        ? { payment: { payment: paymentState as PaymentState } }
        : {}),
    },

    include: {
      consultant: true,
      payment: true,
    },

    orderBy: {
      due_at: "desc",
    },
  });
}

