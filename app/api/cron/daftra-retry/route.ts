// React & Next
import { NextResponse } from "next/server";

// lib
import { isCronRequest } from "@/lib/api/routes/cron-auth";
import { telegramAdmin } from "@/lib/api/telegram/telegram";
import { daftraRetryMessage, runDaftraRetry } from "@/lib/daftra/retry";

export const maxDuration = 300;

// no new send starts in the last 90 seconds: one send can take up to 3 daftra calls of 20s each
const MARGIN_MS = 90_000;

// the daily daftra retry (vercel cron, 03:00 UTC). one telegram summary per run, only when
// something happened
export async function GET(req: Request) {
  // guard
  if (!isCronRequest(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const deadline = Date.now() + maxDuration * 1000 - MARGIN_MS;

  try {
    const summary = await runDaftraRetry(deadline);

    const message = daftraRetryMessage(summary);
    if (message) await telegramAdmin(message);

    return NextResponse.json(
      summary.state === "done"
        ? {
            state: summary.state,
            sent: summary.sent.length,
            failed: summary.failed.length,
            stuck: summary.stuck.length,
            capped: summary.capped.length,
            remaining: summary.remaining,
          }
        : { state: summary.state },
    );
  } catch (err) {
    console.error("[daftra-retry] error", err instanceof Error ? err.name : "error");
    await telegramAdmin("daftra retry: the run failed | unexpected error");
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
