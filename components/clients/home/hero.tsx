// React & Next
import Image from "next/image";

// components
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";

// icons
import { ArrowLeft } from "lucide-react";

const Hero = () => {
  return (
    <div className="relative w-full min-h-[60vh] flex items-center justify-center sm:justify-start">
      {/* desktop background image */}
      <Image
        src="/layout/hero-desktop.png"
        alt="hero background"
        fill
        className="hidden sm:block object-cover"
        priority
      />
      {/* mobile background image */}
      <Image
        src="/layout/hero-mobile.png"
        alt="hero background"
        fill
        className="sm:hidden object-cover"
        priority
      />

      {/* overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* content */}
      <div className="relative flex flex-col items-center sm:items-start gap-5 max-w-xl px-4 sm:mx-5 z-10">
        <div className="inline-flex items-center mb-4 gap-2">
          <Image
            src="/svg/shwerni-logo-icon.svg"
            alt="shwerni"
            width={25}
            height={25}
          />
          <h5 className="text-white text-lg font-medium">
            قراراتك تبدأ من استشارة صحيحة
          </h5>
        </div>

        <h2 className="text-white text-3xl sm:text-4xl text-center sm:text-right font-semibold mb-4">
          استشارات نفسية موثوقة متاحة لك في أي وقت وأي مكان
        </h2>

        <p className="text-white/90 text-center sm:text-right  mb-6">
          عبر {`"شاورني"`}، يمكنك الوصول بسهولة إلى استشارات نفسية موثوقة
          ومحادثات سرية مع مختصين معتمدين، لمساعدتك على مواجهة ضغوط الحياة بثقة
          وهدوء.
        </p>

        <div className="flex items-center gap-6 sm:gap-4">
          <LinkButton variant="primary" href="/consultants">
            <IconLabel label="احجز موعدك الآن" Icon={ArrowLeft} />
          </LinkButton>
          <LinkButton variant="secondary" href="/consultants">
            اطلع على كافة المستشارين
          </LinkButton>
        </div>
      </div>
    </div>
  );
};

export default Hero;
