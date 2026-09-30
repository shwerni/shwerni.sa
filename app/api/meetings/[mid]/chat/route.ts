// React & Next
import { NextRequest, NextResponse } from "next/server";

// prisma data
import { getMeetingAccess, getMeetingData } from "@/data/chats";

interface Params {
  params: Promise<{ mid: string }>;
}

export async function GET(req: NextRequest, { params }: Params) {
  const { mid } = await params;

  // same rule as the /chats/[mid] page: the caller must hold a participant token of this meeting
  const participant = req.nextUrl.searchParams.get("participant") ?? "";
  const access = await getMeetingAccess(mid);
  const isParticipant =
    !!participant &&
    !!access?.participants.some((p) => p.participant === participant);

  // another meeting looks exactly like a missing one
  if (!isParticipant)
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
