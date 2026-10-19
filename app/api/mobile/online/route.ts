// packages
import { createGetRoute } from "@/lib/api/routes/route-factory";
import type { NextRequest } from "next/server";

// utils
import { getConsultantsOnline } from "@/data/online";

// types
import { ConsultantCard } from "@/types/layout";

const BACKEND_URL = process.env.BACKEND_URL!;

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

    const res = await fetch(`${BACKEND_URL}/presence/online`, {
      cache: "no-store",
    });
    const { onlineIds } = await res.json();

    const consultants = await getConsultantsOnline(onlineIds, {
      search,
      categories,
      gender,
    });
    return { consultants: consultants.map(toCard) };
  }, { errorMessage: "failed to fetch" },
);
