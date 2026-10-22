// packages
import { NextResponse } from "next/server";

// utils
import { getConsultantsOnline } from "@/data/online";
import { getRealtimeOnlineIds } from "@/lib/api/realtime/internal";

export async function GET() {
  // ask nest for the live snapshot first (the guarded list, server-side with the secret),
  // it's instant and needs no db hit
  const onlineIds = await getRealtimeOnlineIds();

  const consultants = await getConsultantsOnline(onlineIds);
  return NextResponse.json({ consultants });
}
