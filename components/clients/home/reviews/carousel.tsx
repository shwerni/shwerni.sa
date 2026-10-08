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
} from "@/components/ui/carousel";
import ReviewCard from "@/components/clients/shared/review-card";

// hooks
import { useAutoplayWhileVisible } from "@/hooks/use-autoplay-while-visible";

// utils
import { cn } from "@/utils/utils";

// prisma types
import type { ReviewCardData } from "@/components/clients/shared/review-card";

// props
interface Props {
  reviews: ReviewCardData[];
}

const ReviewsCarousel = ({ reviews }: Props) => {
  // states
  const [count, setCount] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [api, setApi] = React.useState<CarouselApi>();

  // carousel auto scroll, only while the carousel is on screen
  const plugin = React.useRef(
    Autoplay({
      delay: 4500,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      playOnInit: false,
    })
  );
  // eslint-disable-next-line react-hooks/refs
  useAutoplayWhileVisible(api, plugin.current);

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
    <div className="space-y-10">
      <Carousel
        plugins={[plugin.current]}
        opts={{ loop: true, direction: "rtl" }}
        setApi={setApi}
      >
        <CarouselContent>
          {reviews.map((i, index) => (
            <CarouselItem
              key={index}
              className="max-w-[300px] sm:max-w-[400px]"
            >
              <ReviewCard review={i} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
      {/* current dots */}
      <div className="flex items-center justify-center gap-1.5">
        {Array.from({ length: Math.round(count / 2) }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-7 h-0.5 rounded",
              Math.round(current / 2) === index + 1 ? "bg-theme" : "bg-gray-100"
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default ReviewsCarousel;
