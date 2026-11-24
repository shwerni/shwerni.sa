import "server-only";
// prisma db
import prisma from "@/lib/database/db";

// prisma prisma
import { PaymentState, UserRole } from "@/lib/generated/prisma/enums";

// get unique user by phone
export const getUserLogin = async (phone: string, administrator: boolean) => {
  try {
    // get public user
    // web login: clients, consultants and center accounts; management login: staff only
    // (a center account never signs in through the management login)
    const user = administrator
      ? await prisma.user.findFirst({
          where: {
            phone,
            role: {
              notIn: [UserRole.USER, UserRole.OWNER, UserRole.CENTER],
            },
          },
        })
      : await prisma.user.findFirst({
          where: {
            phone,
            role: {
              in: [UserRole.USER, UserRole.OWNER, UserRole.CENTER],
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

// the user fields the website reads by id (session, layouts, settings handlers). an explicit select:
// never the password hash, passwordChangedAt, the other account dates or tokens
const accountSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  phoneVerified: true,
  updated_at: true,
} as const;

// get unique user by Id
export const getUserById = async (id: string) => {
  try {
    const exist = await prisma.user.findUnique({
      where: { id },
      select: accountSelect,
    });
    // if not exist
    if (!exist) return null;
    // return
    return exist;
  } catch {
    return null;
  }
};

/**
 * the account settings page's user: only what its client form shows and sends (it goes to the
 * browser). never the password hash, passwordChangedAt or tokens
 * @param id the session user
 */
export const getProfileUser = async (id: string) => {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, phone: true, updated_at: true },
    });
  } catch {
    return null;
  }
};

// get unique user by Id
export const getUsersByRole = async (role: UserRole) => {
  try {
    const exist = await prisma.user.findMany({
      where: { role },
      select: { id: true, name: true, phone: true, role: true },
    });
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

// createUser register
export const createUser = async (
  role: UserRole,
  username: string,
  email: string | undefined,
  phone: string,
  password: string,
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

export const removeUnverifiedUsers = async (deadline: Date) => {
  try {
    const users = await prisma.user.deleteMany({
      where: {
        phoneVerified: null,
        created_at: {
          lt: deadline,
        },
      },
    });

    return users;
  } catch {
    return null;
  }
};
