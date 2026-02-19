// React & Next
import { cacheLife } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import ReviewsCarousel from "@/components/clients/home/reviews/carousel";

// prisma data
import { getReviewsForHome } from "@/data/review";
import { Suspense } from "react";
import CardSkeleton from "../../shared/card-skeleton";

const Reviews = async () => {
  // reviews
  const reviews = await getReviews();

  // validate
  if (!reviews) return;

  return (
    <Section className="space-y-10 py-10 bg-[#052A47]">
      <Title
        title="تجارب حقيقية ملهمة"
        subTitle="آراء تثق بها"
        variant="light"
      />
      {/* carousel */}
      <Suspense
        fallback={
          <CardSkeleton
            count={3}
            className="flex items-center justify-between w-11/12"
            CardClassName="w-32 h-32"
          />
        }
      >
        <ReviewsCarousel reviews={reviews} />
      </Suspense>
    </Section>
  );
};

export default Reviews;

const getReviews = async () => {
  "use cache";
  cacheLife("minutes");

  // reviews
  return await getReviewsForHome();
};
