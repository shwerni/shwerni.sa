// packages
import { NextResponse } from "next/server";

// utils
import { getConsultantsByUserIds } from "@/data/online";

const REALTIME_URL = process.env.BackEnd_URL!;

export async function GET() {
  // ask nest for the live snapshot first, it's instant and needs no db hit
  const res = await fetch(`${REALTIME_URL}/presence/online`, {
    cache: "no-store",
  });
  const { onlineIds } = await res.json();

  const consultants = await getConsultantsByUserIds(onlineIds);
  return NextResponse.json({ consultants });
}
