// packages
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// utils
import { mintRealtimeToken } from "@/lib/api/realtime/mint-token";
import { realtimePublicUrl } from "@/lib/api/realtime/public-url";

// a guest token and the realtime server's address (the browser has no other source for it)
export async function GET() {
  const url = realtimePublicUrl();
  if (!url)
    return NextResponse.json({ error: "realtime unavailable" }, { status: 500 });

  const guestId = `guest:${randomUUID()}`;
  const token = await mintRealtimeToken(guestId, "GUEST");
  return NextResponse.json({ token, url });
}
