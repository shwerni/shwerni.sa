// React & Next
import Image from "next/image";

// components
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";
import { Separator } from "@/components/ui/separator";
import DivMotion from "@/components/shared/div-motion";

const Steps = () => {
  // steps
  const steps = [
    {
      title: "اختر المستشار المناسب",
      description:
        "اختر من بين خبراء شاورني المتخصصين للحصول على المشورة المناسبة لك",
      src: "/svg/home/steps-3.svg",
    },
    {
      title: "قم بالتسجيل والحجز",
      description: "احجز موعدك وأكمل إجراءات التسجيل والدفع بسهولة",
      src: "/svg/home/steps-2.svg",
    },
    {
      title: "التواصل مع المستشار",
      description: "يتواصل معك المستشار في الوقت الذي اخترته عبر Google Meet",
      src: "/svg/home/steps-1.svg",
    },
  ];

  return (
    <Section className="space-y-8">
      <Title title="خطوات سهلة لاستخدام شاورني" subTitle="ابدأ رحلتك" />
      {/* content */}
      <div className="space-y-2 max-w-4xl mx-auto">
        {/* steps icons */}
        <div className="flex flex-col md:flex-row items-center justify-center md:gap-40">
          {steps.map((i, index) => (
            <DivMotion
              key={index}
              className="flex items-center flex-col md:flex-row md:gap-8"
            >
              <Image src={i.src} alt="steps" width={90} height={90} />
              {index !== steps.length - 1 && (
                <Separator className="hidden md:block h-0.5! bg-[#165A93] rounded" />
              )}
              {/* mobile */}
              <div className="flex md:hidden items-center justify-between">
                <div
                  key={index}
                  className="flex flex-col items-center gap-2 max-w-60"
                >
                  <h4 className="text-[#094577] text-lg text-center font-semibold">
                    {i.title}
                  </h4>
                  <p className="text-base text-center">{i.description}</p>
                </div>
              </div>
              {/* separators */}
              {index !== steps.length - 1 && (
                <Separator
                  className="block md:hidden w-0.5! h-16! my-4 md:my-8 bg-[#165A93] rounded"
                  orientation="vertical"
                />
              )}
            </DivMotion>
          ))}
        </div>
        {/* desktop */}
        <div className="hidden md:flex items-center justify-between md:mx-10">
          {steps.map((i, index) => (
            <div
              key={index}
              className="flex flex-col items-center gap-2 max-w-60"
            >
              <h4 className="text-[#094577] text-lg text-center font-semibold">
                {i.title}
              </h4>
              <p className="text-base text-center">{i.description}</p>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default Steps;
