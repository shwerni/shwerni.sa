"use client";
// React & Next
import React from "react";
import Link from "next/link";

// packages
import Autoplay from "embla-carousel-autoplay";

// lib
import { Program } from "@/lib/generated/prisma/client";

// components
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import ProgramCard from "@//components/clients/shared/program-card";

// props
interface Props {
  programs: Program[];
}

const ProgramsCarousel = ({ programs }: Props) => {
  // carousel auto scroll
  const plugin = React.useRef(
    Autoplay({
      delay: 5000,
      stopOnInteraction: false,
      stopOnMouseEnter: false,
    })
  );

  return (
    <Carousel
      plugins={[plugin.current]}
      opts={{ loop: true, direction: "rtl" }}
    >
      <CarouselContent>
        {programs.map((i, index) => (
          <CarouselItem key={index} className="max-w-[305px]">
            <Link href={`/programs/${i.prid}`}>
              <ProgramCard program={i} />
            </Link>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default ProgramsCarousel;
