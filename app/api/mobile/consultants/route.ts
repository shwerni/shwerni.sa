import { requireAppSecret } from "@/utils/app";
import { NextRequest, NextResponse } from "next/server";
import { getPuslishedConsultantsForHome } from "@/data/consultant";

export async function GET(request: NextRequest) {
  const auth = await requireAppSecret(request);

  if (auth instanceof Response) return auth;

  try {
    const result = await getPuslishedConsultantsForHome();

   const stringifiedData = JSON.stringify(result, (key, value) => 
    typeof value === "bigint" ? Number(value) : value
  );

  return new Response(stringifiedData, {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
  } catch {
    return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  }
}
