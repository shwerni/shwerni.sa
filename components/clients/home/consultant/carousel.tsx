"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import Autoplay from "embla-carousel-autoplay";

// components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ConsultantCard from "@/components/clients/shared/consultant-card";

// types
import { ConsultantCard as ConsultantCardType } from "@/types/layout";

// props
interface Props {
  consultants: ConsultantCardType[];
}

const ConsultantsCarousel = ({ consultants }: Props) => {
  // carousel auto scroll
  const plugin = React.useRef(
    Autoplay({
      delay: 2700,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    }),
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{ loop: true, direction: "rtl" }}
    >
      <CarouselContent>
        {consultants.map((i, index) => (
          <CarouselItem key={index} className="max-w-[305px]">
            {/* conultant card data  */}
            <Link href={`/consultants/${i.cid}`}>
              <ConsultantCard
                consultant={i}
                //   favorites={favorites}
                //   author={userId}
                //   role={userRole}
              />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default ConsultantsCarousel;
