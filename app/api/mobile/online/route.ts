// packages
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import type { NextRequest } from "next/server";

// utils
import { getConsultantsOnline } from "@/data/online";

// types
import { ConsultantCard } from "@/types/layout";

const BACKEND_URL = process.env.BACKEND_URL!;

interface OnlineConsultantsResponse {
  consultants: ConsultantCard[];
}

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
    return { consultants };
  },
);
