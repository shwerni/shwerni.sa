// React & Next
import { NextResponse } from "next/server";

// prisma types
import { getOfficialInstantOwners } from "@/data/instant";

export async function GET() {
  try {
    // instant data
    const hotline = await getOfficialInstantOwners();

    // return
    return NextResponse.json(hotline);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 }
    );
  }
}
