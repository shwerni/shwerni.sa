// packages
import { NextResponse } from "next/server";

// utils
import { getConsultantsOnline } from "@/data/online";

const BACKEND_URL = process.env.BACKEND_URL!;

export async function GET() {
  // ask nest for the live snapshot first, it's instant and needs no db hit
  const res = await fetch(`${BACKEND_URL}/presence/online`, {
    cache: "no-store",
  });
  const { onlineIds } = await res.json();

  const consultants = await getConsultantsOnline(onlineIds);
  return NextResponse.json({ consultants });
}
