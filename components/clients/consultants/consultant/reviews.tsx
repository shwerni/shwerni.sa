// React & Next
import { cacheLife } from "next/cache";

// components
import { ScrollArea } from "@/components/ui/scroll-area";
import ReviewCard from "@/components/clients/shared/review-card";

// prisma data
import { getConsultantReviews } from "@/data/consultant";

// icons
import { CiStar } from "react-icons/ci";
import { Suspense } from "react";
import CardSkeleton from "../../shared/card-skeleton";

// props
interface Props {
  cid: number;
}

const ConsultantReviews = async ({ cid }: Props) => {
  // reviews
  const reviews = await getReviews(cid);
  // validate
  if (!reviews || reviews.length === 0) return;

  return (
    <div className="space-y-3">
      {/* title */}
      <div className="inline-flex items-center gap-2">
        <CiStar className="w-5 h-5 text-theme" />
        <h4 className="text-[#094577] text-base font-semibold">
          التقييمات ({reviews.length})
        </h4>
      </div>
      {/* coupons */}
      <Suspense fallback={<CardSkeleton count={3} CardClassName="w-32 h-32" className="flex flex-col gap-3"/>}>
        <ScrollArea className="h-96 gap-2" dir="rtl">
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id}>
                <ReviewCard
                  review={review}
                  className="border border-gray-200"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </Suspense>
    </div>
  );
};

const getReviews = async (cid: number) => {
  "use cache";
  cacheLife("hours");
  // reviews
  return await getConsultantReviews(cid);
};

export default ConsultantReviews;
