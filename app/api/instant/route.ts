// React & Next
import { NextResponse } from "next/server";

// prisma types
import { getAllInstantOwners, getOfficialInstantOwners } from "@/data/instant";

// lib
import { getOnlineUsers } from "@/lib/database/supabase";
import { getSupabaseConfig } from "@/lib/database/supabase/config";

export async function GET() {
  try {
    // instant data
    const [owners, officials, userIds] = await Promise.all([
      getAllInstantOwners(),
      getOfficialInstantOwners(),
      getOnlineUsers(getSupabaseConfig()),
    ]);

    // if response not exist
    if (!owners || !userIds)
      return NextResponse.json({ message: "no data" }, { status: 200 });

    // online users
    const onlineUsers = new Set(userIds);

    // only online
    const instant = Array.from(
      new Map(
        owners
          .filter((owner) => onlineUsers.has(owner.userId))
          .map((owner) => [owner.userId, owner]),
      ).values(),
    );

    // return
    return NextResponse.json([...(officials ?? []), ...instant]);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch data" },
      { status: 500 },
    );
  }
}
