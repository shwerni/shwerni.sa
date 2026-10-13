// React & Next
import { NextResponse } from "next/server";

// packages
import { UTApi } from "uploadthing/server";

// lib
import { verifyDashboardSecret } from "@/lib/auth/dashboard-secret";

// nothing in this codebase calls this route; external callers (the dashboard) must send x-dashboard-secret
const isDashboard = verifyDashboardSecret;

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
