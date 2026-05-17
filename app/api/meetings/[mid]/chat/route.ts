// React & Next
import { NextRequest, NextResponse } from "next/server";

// prisma data
import { getMeetingData } from "@/data/chats";

interface Params {
  params: Promise<{ mid: string }>;
}

export async function GET(_req: NextRequest, { params }: Params) {
  // get meeting data
  const result = await getMeetingData((await params).mid);

  // validate
  if (result?.error) {
    const status = result.error === "Meeting not found" ? 404 : 500;
    return NextResponse.json({ error: result.error }, { status });
  }

  // return data
  return NextResponse.json(result?.data);
}
