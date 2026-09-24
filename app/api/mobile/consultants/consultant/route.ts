// packages
import { getConsultant } from "@/data/consultant";

// data
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// primsa types
import { Consultant } from "@/lib/generated/prisma/client";

// types
type ConsultantWithExtras = Consultant & {
  years: number;
  reviews: number;
  specialties: string[];
  isFavorite?: boolean;
};

export const GET = createGetRoute<ConsultantWithExtras>(async (request) => {
  const cid = Number(request.nextUrl.searchParams.get("cid"));

  if (!cid || Number.isNaN(cid)) {
    throw new Error("missing or invalid cid");
  }

  const user = await requireMobileUser(request);
  const consultant = await getConsultant(cid, user?.id ?? null);

  if (!consultant) {
    throw new Error("consultant not found");
  }

  return consultant;
});