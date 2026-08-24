"use server";

// prisma db
import prisma from "@/lib/database/db";

/**
 * upserts today's peak concurrent counts and increments the connection-event
 * counter for whichever role just connected — not strictly unique visitors,
 * just "how many connection events happened today", cheap and simple
 */
export async function recordInstantSnapshot(
  consultantsNow: number,
  clientsNow: number,
  role: "OWNER" | "USER" | "GUEST",
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalField =
    role === "OWNER"
      ? "consultantsTotal"
      : role === "USER"
        ? "clientsTotal"
        : null;

  await prisma.$executeRaw`
    INSERT INTO instants (id, date, "consultantsPeak", "clientsPeak", "consultantsTotal", "clientsTotal")
    VALUES (
      gen_random_uuid(),
      ${today},
      ${consultantsNow},
      ${clientsNow},
      ${role === "OWNER" ? 1 : 0},
      ${role === "USER" ? 1 : 0}
    )
    ON CONFLICT (date) DO UPDATE SET
      "consultantsPeak" = GREATEST(instants."consultantsPeak", ${consultantsNow}),
      "clientsPeak" = GREATEST(instants."clientsPeak", ${clientsNow}),
      "consultantsTotal" = instants."consultantsTotal" + ${role === "OWNER" ? 1 : 0},
      "clientsTotal" = instants."clientsTotal" + ${role === "USER" ? 1 : 0}
  `;
}

/**
 * increments today's unique-seen counters — call once per role the first
 * time that specific user is observed online today, not on every event
 */
export async function recordUniqueInstantVisitor(role: "OWNER" | "USER") {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const field = role === "OWNER" ? "consultantsTotal" : "clientsTotal";

  await prisma.instant.upsert({
    where: { date: today },
    create: {
      date: today,
      consultantsPeak: 0,
      clientsPeak: 0,
      consultantsTotal: role === "OWNER" ? 1 : 0,
      clientsTotal: role === "USER" ? 1 : 0,
    },
    update: {
      [field]: { increment: 1 },
    },
  });
}

/**
 * today's snapshot for an admin/stats view
 */
export async function getTodayInstantStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.instant.findUnique({ where: { date: today } });
}

/**
 * historical daily stats for a date range, most recent first
 */
export async function getInstantStatsRange(days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  since.setHours(0, 0, 0, 0);

  return prisma.instant.findMany({
    where: { date: { gte: since } },
    orderBy: { date: "desc" },
  });
}
