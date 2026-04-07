// React & Next
import { NextResponse } from "next/server";

// prsima data
import { reshuffleConsultants } from "@/data/shuffle";

export const GET = async (req: Request) => {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const result = await reshuffleConsultants(secret);

  if (!result.success)
    return NextResponse.json(result, { status: 401 });

  return NextResponse.json(result);
};