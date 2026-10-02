// React & Next
import Image, { getImageProps } from "next/image";

// components
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";

// icons
import { ArrowLeft } from "lucide-react";

// one art-directed <picture>: each screen size downloads only its own background
// (two <Image>s hidden by css both downloaded, the hidden one included)
const heroImage = {
  alt: "hero background",
  fill: true,
  sizes: "100vw",
  loading: "eager",
  fetchPriority: "high",
} as const;

const Hero = () => {
  const {
    props: { srcSet: desktopSrcSet },
  } = getImageProps({ ...heroImage, src: "/layout/hero-desktop.png" });
  const {
    props: { srcSet: mobileSrcSet, ...mobileImage },
  } = getImageProps({ ...heroImage, src: "/layout/hero-mobile.png" });

  return (
    <div className="relative w-full min-h-[60vh] flex items-center justify-center sm:justify-start">
      {/* background image: desktop from sm (640px) up, mobile below.
          "contents" keeps <picture> out of the flex layout, like the old absolutely-placed images */}
      <picture className="contents">
        <source media="(min-width: 640px)" srcSet={desktopSrcSet} sizes="100vw" />
        <source media="(max-width: 639px)" srcSet={mobileSrcSet} sizes="100vw" />
        {/* alt comes from getImageProps */}
        {/* eslint-disable-next-line jsx-a11y/alt-text */}
        <img {...mobileImage} className="object-cover" />
      </picture>

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
      </div>
    </div>
  );
};

export default Hero;