"use server";
// packages
import moment from "moment";
import { startOfDay, endOfDay } from "date-fns";

// prisma db
import prisma from "@/lib/database/db";

import {
  Categories,
  ConsultantState,
  OrderType,
  PaymentState,
  UserRole,
} from "@/lib/generated/prisma/enums";

// owner counts statistics
export const statisticsgetAllOwnerCount = async () => {
  try {
    // Execute all queries in parallel
    const [
      owners,
      approved,
      published,
      family,
      familyPublished,
      law,
      lawPublished,
      psychic,
      psychicPublished,
    ] = await Promise.all([
      prisma.consultant.count(),
      prisma.consultant.count({
        where: { statusA: ConsultantState.PUBLISHED },
      }),
      prisma.consultant.count({
        where: { status: true, statusA: ConsultantState.PUBLISHED },
      }),
      prisma.consultant.count({
        where: { category: Categories.FAMILY },
      }),
      prisma.consultant.count({
        where: {
          category: Categories.FAMILY,
          status: true,
          statusA: ConsultantState.PUBLISHED,
        },
      }),
      prisma.consultant.count({
        where: { category: Categories.LAW },
      }),
      prisma.consultant.count({
        where: {
          category: Categories.LAW,
          status: true,
          statusA: ConsultantState.PUBLISHED,
        },
      }),
      prisma.consultant.count({
        where: { category: Categories.PSYCHIC },
      }),
      prisma.consultant.count({
        where: {
          category: Categories.PSYCHIC,
          status: true,
          statusA: ConsultantState.PUBLISHED,
        },
      }),
    ]);

    // return all owners counts
    return {
      owners,
      approved,
      published,
      family: { all: family, published: familyPublished },
      law: { all: law, published: lawPublished },
      psychic: { all: psychic, published: psychicPublished },
    };
  } catch {
    // return
    return null;
  }
};

// user counts statistics
export const statisticsgetUsersCount = async () => {
  try {
    // Execute query
    const user = await prisma.user.count();
    // owner
    const owner = await prisma.user.count({ where: { role: UserRole.OWNER } });
    // clients
    const clinet = await prisma.user.count({ where: { role: UserRole.USER } });
    // return all users counts
    return { user, clinet, owner };
  } catch {
    // return
    return null;
  }
};

// user counts statistics
export const statisticsgetUsers = async () => {
  try {
    // Execute query
    const user = await prisma.user.findMany({
      select: { role: true, created_at: true },
    });
    // return all users counts
    return user;
  } catch {
    // return
    return null;
  }
};

// order counts statistics
export const statisticsgetAllOrders = async () => {
  try {
    // Execute all queries in parallel
    const [orders, paid, refund] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { payment: { payment: PaymentState.PAID } } }),
      prisma.order.count({ where: { payment: { payment: PaymentState.REFUND } } }),
    ]);

    // return all orders counts
    return {
      orders,
      paid,
      refund,
    };
  } catch {
    // return
    return null;
  }
};

// orders get statistics
export const statisticsMeetings = async () => {
  // orders
  const orders = await prisma.order.findMany({
    where: {
      payment: { payment: PaymentState.PAID },
    },
    select: {
      created_at: true,
      meeting: {
        select: { url: true },
      },
    },
  });

  // record
  const grouped: Record<string, { done: number; yet: number }> = {};

  // count
  for (const order of orders) {
    const date = moment(order.created_at).format("YYYY-MM-DD");
    if (!grouped[date]) grouped[date] = { done: 0, yet: 0 };

    const meetings = order.meeting || [];

    if (meetings.length === 0) {
      grouped[date].yet += 1;
    } else {
      const hasUrl = meetings.some((m) => m.url); // at least one with URL
      if (hasUrl) {
        grouped[date].done += 1;
      } else {
        grouped[date].yet += 1;
      }
    }
  }

  const result = Object.entries(grouped).map(([date, { done, yet }]) => ({
    date,
    done,
    yet,
  }));

  // return
  return result;
};

// get deatailed paid orders
export const statisticsAllPaidOrders = async () => {
  try {
    // orders
    const orders = await prisma.order.groupBy({
      by: ["created_at"],
      where: {
        payment: { payment: PaymentState.PAID },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // days results
    const dResult = orders.map((order) => ({
      date: moment(order.created_at).format("YYYY-MM-DD"),
      count: order._count._all,
    }));
    // get month and year statistics
    const statistics = monthYearStatistics(orders);

    // return
    return {
      days: dResult,
      months: statistics.months,
      years: statistics.years,
    };
  } catch {
    // return
    return null;
  }
};

// get deatailed other orders
export const statisticsAllOtherOrders = async () => {
  try {
    // orders
    const orders = await prisma.order.groupBy({
      by: ["created_at"],
      where: {
        payment: {
          payment: { not: PaymentState.PAID },
        },
      },
      _count: {
        _all: true,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    // days results
    const dResult = orders.map((order) => ({
      date: moment(order.created_at).format("YYYY-MM-DD"),
      count: order._count._all,
    }));

    // get month and year statistics
    const statistics = monthYearStatistics(orders);
    // return
    return {
      days: dResult,
      months: statistics.months,
      years: statistics.years,
    };
  } catch {
    // return
    return null;
  }
};

// group order count by month & year
function monthYearStatistics(
  orders: {
    created_at: Date;
    _count: {
      _all: number;
    };
  }[]
) {
  // month & year
  const monthlyCounts: { [key: string]: number } = {};
  const yearlyCounts: { [key: string]: number } = {};
  // count month & year
  orders.forEach((order) => {
    const formattedMonth = moment(order.created_at).format("YYYY-MM");
    const formattedYear = moment(order.created_at).format("YYYY");

    // Update monthly counts
    if (monthlyCounts[formattedMonth]) {
      monthlyCounts[formattedMonth] += order._count._all;
    } else {
      monthlyCounts[formattedMonth] = order._count._all;
    }

    // Update yearly counts
    if (yearlyCounts[formattedYear]) {
      yearlyCounts[formattedYear] += order._count._all;
    } else {
      yearlyCounts[formattedYear] = order._count._all;
    }
  });
  // months statistics result
  const monthlyResult = Object.entries(monthlyCounts).map(([date, count]) => ({
    date,
    count,
  }));

  // years statistics result
  const yearlyResult = Object.entries(yearlyCounts).map(([date, count]) => ({
    date,
    count,
  }));
  // return
  return { months: monthlyResult, years: yearlyResult };
}

// today statistics
export const statisticsgetToday = async (from: Date, to: Date) => {
  try {
    // dates
    const startDate = startOfDay(from);
    const endDate = endOfDay(to);

    // user
    const user = await prisma.user.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        role: UserRole.USER,
      },
    });
    // owner
    const owner = await prisma.user.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        role: UserRole.OWNER,
      },
    });
    // pre consultation
    const preConsultation = await prisma.preConsultation.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    // paid orders
    const orders = await prisma.order.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment: { payment: PaymentState.PAID },
      },
    });
    // instant orders
    const instant = await prisma.order.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment: { payment: PaymentState.PAID },
        type: OrderType.INSTANT,
      },
    });
    // scheduled orders
    const scheduled = await prisma.order.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
        payment: { payment: PaymentState.PAID },
        type: OrderType.SCHEDULED,
      },
    });
    // reviews
    const reviews = await prisma.review.count({
      where: {
        created_at: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
    // return all
    return {
      user,
      owner,
      preConsultation,
      orders,
      instant,
      scheduled,
      reviews,
    };
  } catch {
    return null;
  }
};
