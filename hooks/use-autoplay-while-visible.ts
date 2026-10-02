"use client";
// React & Next
import { useEffect } from "react";

// packages
import type { AutoplayType } from "embla-carousel-autoplay";

// types
import type { CarouselApi } from "@/components/ui/carousel";

// runs an embla autoplay only while its carousel is on screen. create the plugin with
// playOnInit: false; off-screen carousels then do no timer or animation work
export function useAutoplayWhileVisible(
  api: CarouselApi | undefined,
  autoplay: AutoplayType,
) {
  useEffect(() => {
    if (!api) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) autoplay.play();
      else autoplay.stop();
    });

    observer.observe(api.rootNode());

    return () => observer.disconnect();
  }, [api, autoplay]);
}
