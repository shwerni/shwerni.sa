// React & Next
import { NextResponse } from "next/server";

// packages
import { timingSafeEqual } from "crypto";
import { UTApi } from "uploadthing/server";

// nothing in this codebase calls this route; external callers (the dashboard) must send x-dashboard-secret
function isDashboard(request: Request) {
  const provided = Buffer.from(request.headers.get("x-dashboard-secret") ?? "");
  const expected = Buffer.from(process.env.DASHBOARD_SECRET ?? "");

  // timingSafeEqual throws on different lengths, and an unset secret must never match
  if (!expected.length || provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

// delete files
export async function POST(request: Request) {
  // secret check
  if (!isDashboard(request))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // data
  const data = await request.json();
  // key
  const key = data.key;
  // upload thing api
  const utapi = new UTApi();
  // deleting files
  try {
    // delete image
    await utapi.deleteFiles(key);
    // return
    return NextResponse.json({
      success: true,
      message: "success",
    });
  } catch (error) {
    // error
    return NextResponse.json({
      success: false,
      message: "error",
    });
  }
}
