// React & Next
import { Suspense } from "react";
import { cacheLife } from "next/cache";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import CouponsCarousel from "@/components/clients/home/coupons/carousel";

// prisma data
import { getCouponsForHome } from "@/data/coupon";

const Coupons = async () => {
  // coupons
  const coupons = await getCoupons();

  // validate
  if (!coupons) return;

  return (
    <Section className="space-y-8">
      <Title title="استفد الآن… دعم أكبر وتكلفة أقل" subTitle="كوبونات مميزة" />
      {/* coupons */}
      <Suspense
        fallback={
          <CardSkeleton
            className="flex justify-between items-center w-11/12"
            CardClassName="w-32 h-20"
            count={3}
          />
        }
      >
        <CouponsCarousel coupons={coupons} />
      </Suspense>
    </Section>
  );
};

export default Coupons;

// get coupons
const getCoupons = async () => {
  "use cache";
  cacheLife("hours");
  // coupons
  return await getCouponsForHome();
};
