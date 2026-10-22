// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";
import type { NextRequest } from "next/server";

// utils
import { getConsultantsOnline } from "@/data/online";
import { getRealtimeOnlineIds } from "@/lib/api/realtime/internal";

// types
import { ConsultantCard } from "@/types/layout";

interface OnlineConsultantsResponse {
  consultants: ConsultantCard[];
}

// public card fields only: getConsultantsOnline also returns the consultant's user id,
// which the website's /api/online keeps but the app must never receive
const toCard = (c: ConsultantCard): ConsultantCard => ({
  cid: c.cid,
  name: c.name,
  title: c.title,
  image: c.image,
  category: c.category,
  rate: c.rate,
  gender: c.gender,
  cost30: c.cost30,
  created_at: c.created_at,
  reviews: c.reviews,
  years: c.years,
  specialties: c.specialties,
});

export const GET = createGetRoute<OnlineConsultantsResponse>(
  async (request: NextRequest) => {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") ?? undefined;
    const categories =
      searchParams.get("categories")?.split(",").filter(Boolean) ?? [];
    const gender = searchParams.get("gender") ?? undefined;

    // the guarded list, server-side with the secret; a failure throws into the route's own
    // error response, as before
    const onlineIds = await getRealtimeOnlineIds();

    const consultants = await getConsultantsOnline(onlineIds, {
      search,
      categories,
      gender,
    });
    return { consultants: consultants.map(toCard) };
  }, { errorMessage: "failed to fetch" },
);
