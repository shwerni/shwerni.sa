import prisma from "@/lib/database/db";

const KEY_TTL_MINUTES = 5; // safety-net cleanup for rows stuck longer than expected

export async function enqueueMessage(
  phone: string,
  text: string,
  fromId: string,
  fromName: string,
  now: number,
  debounceMs: number,
): Promise<void> {
  const safeText = text.replace(/'/g, "''");
  const safePhone = phone.replace(/'/g, "''");
  const safeFromId = fromId.replace(/'/g, "''");
  const safeFromName = fromName.replace(/'/g, "''");
  const dueAt = now + debounceMs;

  await prisma.$executeRaw`
    INSERT INTO "wa-debounce" (phone, "lastMsgAt", "dueAt", "fromId", "fromName", queue, "updatedAt")
    VALUES (${safePhone}, ${now}, ${dueAt}, ${safeFromId}, ${safeFromName}, ${JSON.stringify([text])}, NOW())
    ON CONFLICT (phone) DO UPDATE SET
      "lastMsgAt" = ${now},
      "dueAt" = ${dueAt},
      "fromId" = ${safeFromId},
      "fromName" = ${safeFromName},
      "updatedAt" = NOW(),
      queue = (
        SELECT COALESCE(json_agg(val)::text, '[]')
        FROM (
          SELECT json_array_elements_text("wa-debounce".queue::json) AS val
          UNION ALL
          SELECT ${safeText}
        ) combined
      )
  `;
}

// Find rows due for processing right now — used by the cron job
export async function findDueRows(now: number) {
  return prisma.waDebounce.findMany({
    where: { dueAt: { lte: now } },
  });
}

// Atomically claim a due row: locks it (FOR UPDATE SKIP LOCKED) so two
// overlapping cron runs can never both process the same phone, then
// deletes it and returns the queue data in one transaction.
export async function claimDueRow(
  phone: string,
  dueAt: bigint,
): Promise<{ fromId: string; fromName: string; messages: string[] } | null> {
  return prisma.$transaction(async (tx) => {
    type Row = { fromId: string; fromName: string; queue: string };

    const rows = await tx.$queryRaw<Row[]>`
      SELECT "fromId", "fromName", queue
      FROM "wa-debounce"
      WHERE phone = ${phone} AND "dueAt" = ${dueAt}
      FOR UPDATE SKIP LOCKED
    `;

    if (rows.length === 0) return null; // already claimed, or dueAt moved forward

    await tx.waDebounce.delete({ where: { phone } });

    try {
      const messages: string[] = JSON.parse(rows[0].queue);
      if (!messages.length) return null;
      return { fromId: rows[0].fromId, fromName: rows[0].fromName, messages };
    } catch {
      return null;
    }
  });
}

// Safety-net cleanup for rows that never got claimed for some reason
export async function cleanStaleDebounceRows(): Promise<void> {
  const cutoff = new Date(Date.now() - KEY_TTL_MINUTES * 60 * 1000);
  await prisma.waDebounce.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
}