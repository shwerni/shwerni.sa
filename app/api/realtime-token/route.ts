// packages
import { NextResponse } from "next/server";

// auth
import { auth } from "@/auth";

// utils
import { mintRealtimeToken } from "@/lib/api/realtime/mint-token";

// the realtime server only tells OWNER from everyone else (same mapping as the mobile
// realtime-token route): staff roles count as clients instead of falling through as guests
function toRealtimeRole(role: string | null | undefined): "USER" | "OWNER" {
  return role === "OWNER" ? "OWNER" : "USER";
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const token = await mintRealtimeToken(session.user.id, toRealtimeRole(session.user.role));
  return NextResponse.json({ token });
}
