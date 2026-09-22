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

  return (
    <div className="relative w-full min-h-[60vh] flex items-center justify-center sm:justify-start">
      {/* desktop background image */}
      <Image
        src="/other/event/banner.png"
        alt="hero background"
        fill
        priority
        fetchPriority="high"
        className="aspect-[19:6]"
        // className="hidden sm:block object-cover"
        sizes="100vw"
      />
      {/* mobile background image */}
      {/* <Image
        src="/other/event/banner.png"
        alt="hero background"
        fill
        priority
        fetchPriority="high"
        className="sm:hidden object-cover"
        sizes="100vw"
      /> */}

      {/* overlay */}
      {/* <div className="absolute inset-0 bg-black/40" /> */}

      {/* content */}
      {/* <div className="relative flex flex-col items-center sm:items-start gap-5 max-w-xl px-4 sm:mx-5 z-10">
        <div className="inline-flex items-center mb-4 gap-2">
          <Image
            src="/svg/shwerni-logo-icon.svg"
            alt="shwerni"
            width={25}
            height={25}
            priority
          />
          <h5 className="text-white text-lg font-medium">
            قراراتك تبدأ من استشارة صحيحة
          </h5>
        </div>

        <h2 className="text-white text-3xl sm:text-4xl text-center sm:text-right font-semibold mb-4">
          استشارات موثوقة متاحة لك في أي وقت وأي مكان
        </h2>

        <p className="text-white/90 text-center sm:text-right  mb-6">
          عبر {`"شاورني"`}، يمكنك الوصول بسهولة إلى استشارات نفسية واسرية وشخصية
          وقانونية مع مختصين معتمدين وبخصوصية تامة، لمساعدتك على مواجهة ضغوط
          الحياة بثقة وهدوء.
        </p>

        <div className="flex items-center gap-6 sm:gap-4">
          <LinkButton variant="primary" href="/discover">
            <IconLabel label="احجز موعدك الآن" Icon={ArrowLeft} />
          </LinkButton>
          <LinkButton variant="secondary" href="/consultants">
            اطلع على كافة المستشارين
          </LinkButton>
        </div>
      </div> */}
    </div>
  );
};

export default Hero;
