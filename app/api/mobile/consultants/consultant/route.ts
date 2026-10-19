// packages
import { getConsultant, type PublicConsultant } from "@/data/consultant";

// data
import { createGetRoute } from "@/lib/api/routes/route-factory";
import { requireMobileUser } from "@/lib/auth/require-mobile-user";

// the public profile fields only (never phone, commission, admin note, cv or certificates)
export const GET = createGetRoute<PublicConsultant>(async (request) => {
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
}, { errorMessage: "failed to fetch" });