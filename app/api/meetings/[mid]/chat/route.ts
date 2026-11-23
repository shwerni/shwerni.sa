// React & Next
import { NextRequest, NextResponse } from "next/server";

// prisma data
import { getMeetingData } from "@/data/chats";

// handlers
import { chatSide } from "@/handlers/meetings/meeting-access";

interface Params {
  params: Promise<{ mid: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { mid } = await params;

  // the client by their own token (no login); the consultant's token only with his login on
  // this order (chatSide)
  const participant = req.nextUrl.searchParams.get("participant") ?? "";
  const side = await chatSide(mid, participant, "chat-route");

  // another meeting looks exactly like a missing one
  if (!side)
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });

  // get meeting data
  const result = await getMeetingData(mid);

  // validate
  if (result?.error) {
    const status = result.error === "Meeting not found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  // participant tokens are credentials, so none of them go back in the response
  const data = result?.data
    ? {
        ...result.data,
        participants: result.data.participants.map(
          ({ participant: _token, ...rest }) => rest,
        ),
      }
    : result?.data;

  // return data
  return NextResponse.json(data);
}
