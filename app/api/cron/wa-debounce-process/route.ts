import { NextRequest, NextResponse } from "next/server";
import {
  findDueRows,
  claimDueRow,
  cleanStaleDebounceRows,
} from "@/lib/api/ai/bot/debounce";
import { debouncedTextMessage } from "@/lib/api/whatsapp/logic";

export const maxDuration = 30;

export async function GET(request: NextRequest) {
  if (
    request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return new Response("Unauthorized", { status: 401 });
  }

  const now = Date.now();
  const dueRows = await findDueRows(now);

  // Process in parallel — claimDueRow guards against double-processing
  const results = await Promise.allSettled(
    dueRows.map(async (row) => {
      const claimed = await claimDueRow(row.phone, row.dueAt);
      if (!claimed) return { phone: row.phone, processed: false };

      const combined = claimed.messages.join("\n");
      await debouncedTextMessage(
        row.phone,
        claimed.fromId,
        claimed.fromName,
        combined,
      );
      return { phone: row.phone, processed: true };
    }),
  );

  // Cheap safety net — only actually deletes rows older than 5 min,
  // so running it every minute costs one extra indexed query, negligible.
  await cleanStaleDebounceRows();

  const processed = results.filter(
    (r) => r.status === "fulfilled" && r.value.processed,
  ).length;

  return NextResponse.json({ scanned: dueRows.length, processed });
}