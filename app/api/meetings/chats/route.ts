import { NextRequest, NextResponse } from "next/server";
import { UserRole } from "@/lib/generated/prisma/enums";
import { getChatList } from "@/data/chats";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const author = searchParams.get("author"); // user.id from session
  const role = searchParams.get("role") as UserRole | null;

  if (!author || !role) {
    return NextResponse.json(
      { error: "Missing author or role" },
      { status: 400 },
    );
  }

  const chats = await getChatList(author, role);

  if (!chats) {
    return NextResponse.json(
      { error: "Failed to load chats" },
      { status: 500 },
    );
  }

  return NextResponse.json({ chats });
}
