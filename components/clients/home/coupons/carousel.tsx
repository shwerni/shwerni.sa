"use client";
// React & Next
import React from "react";

// packages
import Autoplay from "embla-carousel-autoplay";

// components
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import CouponCard from "@/components/clients/shared/coupons-card";

// utils
import { cn } from "@/lib/utils";

// types
import { CouponConsultant } from "@/types/layout";

// prisma types
import {
  Categories,
  CouponState,
  CouponType,
  CouponVisibility,
  Gender,
} from "@/lib/generated/prisma/enums";

// props
interface Props {
  coupons: CouponConsultant[];
}

const CouponsCarousel = ({ coupons }: Props) => {
  // static coupons
  const sCoupon = {
    id: "static-save10",
    status: CouponState.PUBLISHED,
    code: "SAVE10",
    discount: 10,
    type: CouponType.PLATFORM,
    starts_at: null,
    expires_at: null,
    users: [],
    visibility: CouponVisibility.PUBLIC,
    limits: null,
    created_at: new Date(),
    consultantId: null,
    consultant: {
      name: "منصة شاورني",
      image: "/layout/logo-sm.png",
      category: Categories.FAMILY,
      rate: 0,
      gender: Gender.MALE,
    },
  };

  // states
  const [count, setCount] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [api, setApi] = React.useState<CarouselApi>();

  // carousel auto scroll
  const plugin = React.useRef(
    Autoplay({
      delay: 5500,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  // on change
  React.useEffect(() => {
    if (!api) return;

    setCount(api.scrollSnapList().length);

    setCurrent(api.selectedScrollSnap() + 1);
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, [api]);

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{ loop: true, direction: "rtl" }}
      setApi={setApi}
    >
      <CarouselContent>
        {[sCoupon, ...coupons].map((i, index) => (
          <CarouselItem key={index} className="max-w-[305px]">
            <CouponCard coupon={i} />
          </CarouselItem>
        ))}
      </CarouselContent>
      <div className="flex justify-between w-full px-5 my-8 sm:my-10">
        {/* buttons */}
        <div className="relative flex items-center mx-10">
          <CarouselPrevious className="bg-gray-50 text-gray-700 hover:bg-theme hover:text-white rounded-lg" />
          <CarouselNext className="bg-gray-50 text-gray-700 hover:bg-theme hover:text-white rounded-lg" />
        </div>
        {/* current dots */}
        <div className="flex items-center gap-0.75">
          {Array.from({ length: Math.round(count / 2) }).map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-2.5 h-2.5 rounded-full",
                Math.round(current / 2) === index + 1
                  ? "bg-theme"
                  : "bg-gray-100"
              )}
            />
          ))}
        </div>
      </div>
    </Carousel>
  );
};

export default CouponsCarousel;
