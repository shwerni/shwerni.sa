// packages
import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

// utils
import { mintRealtimeToken } from "@/lib/api/realtime/mint-token";

export async function GET() {
  const guestId = `guest:${randomUUID()}`;
  const token = await mintRealtimeToken(guestId, "GUEST");
  return NextResponse.json({ token });
}