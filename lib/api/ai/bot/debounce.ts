import prisma from "@/lib/database/db";

const KEY_TTL_MINUTES = 2; // clean up stale rows older than 2 min

// ─────────────────────────────────────────────
// Atomic upsert — safe against race conditions
// Uses raw SQL to append to the queue in one operation
// ─────────────────────────────────────────────
export async function enqueueMessage(
  phone: string,
  text: string,
  now: number,
): Promise<void> {
  // Escape single quotes in text to prevent SQL injection
  const safeText = text.replace(/'/g, "''");
  const safePhone = phone.replace(/'/g, "''");

  // Single atomic operation:
  // - If no row exists: INSERT with queue = [text]
  // - If row exists: UPDATE lastMsgAt + APPEND text to existing queue array
  // PostgreSQL json_agg + json_array_elements_text handles the array merge
  await prisma.$executeRaw`
    INSERT INTO "WhatsappDebounce" (phone, "lastMsgAt", queue, "updatedAt")
    VALUES (
      ${safePhone},
      ${now},
      ${JSON.stringify([text])},
      NOW()
    )
    ON CONFLICT (phone) DO UPDATE SET
      "lastMsgAt" = ${now},
      "updatedAt" = NOW(),
      queue = (
        SELECT COALESCE(json_agg(val)::text, '[]')
        FROM (
          SELECT json_array_elements_text("WhatsappDebounce".queue::json) AS val
          UNION ALL
          SELECT ${safeText}
        ) combined
      )
  `;
}

// ─────────────────────────────────────────────
// Check if we are the last message, drain queue atomically
// Returns messages array if we should process, null if we should abort
// ─────────────────────────────────────────────
export async function drainQueueIfLast(
  phone: string,
  myTimestamp: number,
): Promise<string[] | null> {
  // Single read — check timestamp and get queue in one query
  const row = await prisma.waDebounce.findUnique({
    where: { phone },
    select: { lastMsgAt: true, queue: true },
  });

  // Row gone (already processed) or newer message arrived → abort
  if (!row) return null;
  if (Number(row.lastMsgAt) !== myTimestamp) return null;

  // We are the last — delete row atomically before processing
  // (delete returns the row, so we get the queue and clean up in one trip)
  const deleted = await prisma.waDebounce.delete({
    where: {
      phone,
      lastMsgAt: myTimestamp, // extra guard: only delete if timestamp still matches
    },
  });

  if (!deleted) return null;

  try {
    const messages: string[] = JSON.parse(deleted.queue);
    return messages.length > 0 ? messages : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────
// Cleanup — call from a cron route or manually
// Deletes rows older than KEY_TTL_MINUTES (safety net)
// ─────────────────────────────────────────────
export async function cleanStaleDebounceRows(): Promise<void> {
  const cutoff = new Date(Date.now() - KEY_TTL_MINUTES * 60 * 1000);
  await prisma.waDebounce.deleteMany({
    where: { updatedAt: { lt: cutoff } },
  });
}