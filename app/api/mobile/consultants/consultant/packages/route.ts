// data
import { getConsultantsPackages } from "@/data/packages";
import { createGetRoute } from "@/lib/api/routes/create-get-route";

// prisma types
import type { Package } from "@/lib/generated/prisma/client";

export const GET = createGetRoute<Package[]>(async (request) => {
  const cid = Number(request.nextUrl.searchParams.get("cid"));

  if (!cid || Number.isNaN(cid)) {
    throw new Error("missing or invalid cid");
  }

  return getConsultantsPackages(cid);
});