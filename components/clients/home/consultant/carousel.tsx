"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import Autoplay from "embla-carousel-autoplay";

// components
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ConsultantCard from "@/components/clients/shared/consultant-card";

// hooks
import { useAutoplayWhileVisible } from "@/hooks/use-autoplay-while-visible";

// types
import { HomeConsultantCard as ConsultantCardType } from "@/types/layout";

// props
interface Props {
  consultants: ConsultantCardType[];
}

const ConsultantsCarousel = ({ consultants }: Props) => {
  const [api, setApi] = React.useState<CarouselApi>();

  // carousel auto scroll, only while the carousel is on screen
  const plugin = React.useRef(
    Autoplay({
      delay: 2700,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
      playOnInit: false,
    }),
  );
  // eslint-disable-next-line react-hooks/refs
  useAutoplayWhileVisible(api, plugin.current);

  return (
    <Carousel
      // eslint-disable-next-line react-hooks/refs
      plugins={[plugin.current]}
      opts={{ loop: true, direction: "rtl" }}
      setApi={setApi}
    >
      <CarouselContent>
        {consultants.map((i) => (
          <CarouselItem key={i.cid} className="max-w-76.25">
            {/* conultant card data  */}
            <Link href={`/consultants/${i.cid}`} prefetch={false}>
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
