// data
import { getConsultantPaginatedReviews } from "@/data/review";
import { createGetRoute } from "@/lib/api/routes/create-get-route";
import { Review } from "@/lib/generated/prisma/client";

interface ReviewsResponse {
  reviews: Review[];
  nextCursor: string | null;
}

export const GET = createGetRoute<ReviewsResponse>(async (request) => {
  const params = request.nextUrl.searchParams;
  const cid = Number(params.get("cid"));
  const cursor = params.get("cursor");
  const limit = Number(params.get("limit")) || 10;

  if (!cid || Number.isNaN(cid)) {
    throw new Error("missing or invalid cid");
  }

  return getConsultantPaginatedReviews(cid, cursor, limit);
});
