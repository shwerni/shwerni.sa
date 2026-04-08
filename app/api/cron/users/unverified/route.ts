// React & Next
import { NextResponse } from "next/server";
import { removeUnverifiedUsers } from "@/data/user";

// prisma data

// verify cron secret (protect the endpoint)
const isAuthorized = (req: Request) =>
  req.headers.get("authorization") === `Bearer ${process.env.CRON_SECRET}`;

export async function GET(req: Request) {
  // guard
  if (!isAuthorized(req))
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    // remove unverified users past the deadline
    const deadline = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    // clean up users
    const deletedUsers = await removeUnverifiedUsers(deadline);

    // validate
    if (!deletedUsers)
      return NextResponse.json({ error: "failed" }, { status: 500 });

    // return
    return NextResponse.json({
      success: true,
      message: `deleted ${deletedUsers.count} unverified users.`,
    });
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
