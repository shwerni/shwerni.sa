// packages
import { NextResponse } from "next/server";

// auth
import { auth } from "@/auth";

// utils
import { mintRealtimeToken } from "@/lib/api/realtime/mint-token";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await mintRealtimeToken(session.user.id, session.user.role as "USER" | "OWNER");
  return NextResponse.json({ token });
}