// packages
import { getConsultant } from "@/data/consultant";

// data
import { createGetRoute } from "@/lib/api/routes/create-get-route";

// primsa types
import { Consultant } from "@/lib/generated/prisma/client";

// types
type ConsultantWithExtras = Consultant & {
  years: number;
  reviews: number;
  specialties: string[];
};

export const GET = createGetRoute<ConsultantWithExtras>(async (request) => {
  const cid = Number(request.nextUrl.searchParams.get("cid"));

  if (!cid || Number.isNaN(cid)) {
    throw new Error("missing or invalid cid");
  }

  const consultant = await getConsultant(cid);

  if (!consultant) {
    throw new Error("consultant not found");
  }

  return consultant;
});
