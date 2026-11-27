// data
import { getClientPackages } from "@/data/packages";
import { createGetRoute } from "@/lib/api/routes/route-factory";

// prisma types
import type { Package } from "@/lib/generated/prisma/client";

export const GET = createGetRoute<Package[]>(async (request) => {
  const cid = Number(request.nextUrl.searchParams.get("cid"));

  if (!cid || Number.isNaN(cid)) {
    throw new Error("missing or invalid cid");
  }

  // as clients see them: none while his "disable all packages" switch is on
  return getClientPackages(cid);
}, { errorMessage: "failed to fetch" });