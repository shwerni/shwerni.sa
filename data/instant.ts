import "server-only";

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
