"use client";
// React & Next
import React from "react";

// components
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// prisma data
import { getReviewsForConsultant } from "@/data/review";

// prisma data

// utils
import { findReview } from "@/utils";
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";
import { dateToArString } from "@/utils/moment";
import { Review } from "@/lib/generated/prisma/client";

export default function ReviewsPage() {
  const [page, setPage] = React.useState(1);
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [totalPages, setTotalPages] = React.useState(0);
  const [loading, setLoading] = React.useState(false);

  const fetchReviews = async (pageNumber: number) => {
    setLoading(true);
    try {
      const data = await getReviewsForConsultant(pageNumber);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchReviews(page);
  }, [page]);

  const nextPage = () => {
    if (page < totalPages) setPage(page + 1);
  };

  const prevPage = () => {
    if (page > 1) setPage(page - 1);
  };

  return (
    <Section className="p-6 max-w-3xl mx-auto">
      <Btitle title="التقييمات" />
      {loading ? (
        <p className="text-center text-gray-500">جاري التحميل...</p>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center mt-20 space-y-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-32 h-32 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 9l3-3 3 3m0 6l-3 3-3-3"
            />
          </svg>
          <h2 className="text-xl font-semibold text-gray-600">
            لا يوجد تقييمات حتى الآن
          </h2>
          <p className="text-gray-400">
            عندما يقوم العملاء بترك تقييمات، ستظهر هنا.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="p-4 border rounded-lg shadow-sm flex flex-col bg-white hover:shadow-md transition"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-lg text-zblue-200">
                    {r.name}
                  </span>
                  <Badge className={`${findReview(r.status)?.color}`}>
                    {findReview(r.status)?.label}
                  </Badge>
                </div>
                <p className="mb-2">{r.comment}</p>
                <div className="flex justify-between text-sm text-zgrey-50">
                  <span>التقييم: {r.rate} / 5</span>
                  <span>{dateToArString(r.created_at)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-between mt-6">
            <Button onClick={prevPage} disabled={page === 1}>
              السابق
            </Button>
            <Button onClick={nextPage} disabled={page === totalPages}>
              التالي
            </Button>
          </div>
        </>
      )}
    </Section>
  );
}
