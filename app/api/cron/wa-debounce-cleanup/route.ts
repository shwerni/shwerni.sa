import { NextRequest, NextResponse } from "next/server";
import { cleanStaleDebounceRows } from "@/lib/api/ai/bot/debounce";

export async function GET(request: NextRequest) {
  // Protect with a secret so only Vercel Cron can call it
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await cleanStaleDebounceRows();
  return NextResponse.json({ ok: true });
}