// React & Next
import { NextResponse } from "next/server";

// prsima data
import { reshuffleConsultants } from "@/data/shuffle";

// lib
import { isCronRequest } from "@/lib/api/routes/cron-auth";

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) => isCronRequest(req);

export const GET = async (req: Request) => {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const result = await reshuffleConsultants();

    if (!result.success) return NextResponse.json(result, { status: 401 });

    // success
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
};
