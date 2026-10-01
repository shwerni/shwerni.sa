import { NextResponse } from "next/server";
import { getChatList } from "@/data/chats";
import { userServer } from "@/lib/auth/server";

// the author and role come from the session; the ?author= and ?role= query params are ignored
export async function GET() {
  const user = await userServer();

  if (!user?.id || !user.role) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const chats = await getChatList(user.id, user.role);

  if (!chats) {
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 },
    );
  }

  // the other party's participant token is a credential and the list never uses it
  return NextResponse.json({
    chats: chats.map((c) => ({ ...c, otherParticipantId: null })),
  });
}
