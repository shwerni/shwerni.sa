// React & Next
import Image from "next/image";

// components
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";

// icons
import { ArrowLeft } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative w-full aspect-square sm:aspect-video overflow-hidden">
      {/* Mobile Image: Shows on mobile, hides on small screens and up (sm:hidden) */}
      <Image
        src="/other/event/banner-mobile.png"
        alt="hero background (mobile)"
        priority
        fetchPriority="high"
        fill
        className="object-cover sm:hidden"
        sizes="100vw"
      />

      {/* Desktop Image: Hides on mobile, shows on small screens and up (hidden sm:block) */}
      <Image
        src="/other/event/banner.png"
        alt="hero background (desktop)"
        priority
        fetchPriority="high"
        fill
        className="hidden sm:block object-cover"
        sizes="100vw"
      />
    </div>
  );

};

export default Hero;
