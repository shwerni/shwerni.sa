// React & Next
import Image from "next/image";

// components
import ScalesCta from "./scales";
import { Button } from "@/components/ui/button";
import Card from "@/components/clients/shared/card";
import DivMotion from "@/components/shared/div-motion";
import Title from "@/components/clients/shared/titles";
import Section from "@/components/clients/shared/section";

// icons
import { Award, Brain, Goal, Scale, Users } from "lucide-react";

// prisma data
import { getCampaignFor } from "@/data/event";

// prisma types
import { Categories as CategoriesType } from "@/lib/generated/prisma/enums";

// svg
import Law from "@/public/svg/icons/categories-law.svg";
import Family from "@/public/svg/icons/categories-family.svg";
import Psychic from "@/public/svg/icons/categories-psychic.svg";
import { EventCard } from "../sub-pages/event/event-card";

const Categories = async () => {
  const url = (category: CategoriesType) => {
    return `/consultants?categories=${category}`;
  };

  const campaign = await getCampaignFor("HOME_CARD");

  const categories = [
    {
      id: CategoriesType.FAMILY,
      label: "الأسرة",
      sub: "زواج · طلاق · أبناء",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      icon: Users,
      style: "bg-green-50 text-green-600 border-green-100",
      dot: "bg-green-500",
    },
    {
      id: CategoriesType.PSYCHIC,
      label: "الدعم النفسي",
      sub: "قلق · اكتئاب · ضغوط",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      style: "bg-blue-50 text-blue-600 border-blue-100",
      dot: "bg-blue-500",
      icon: Brain,
    },
    {
      id: CategoriesType.LAW,
      label: "القانون",
      sub: "عقود · حقوق · نزاعات",
      iconBg: "bg-rose-100",
      iconColor: "text-rose-600",
      style: "bg-red-50 text-red-600 border-red-100",
      dot: "bg-red-500",
      icon: Scale,
    },
    {
      id: CategoriesType.PERSONAL,
      label: "التطوير الشخصي",
      sub: "أهداف · مهارات · ثقة",
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      icon: Award,
      style: "bg-amber-50 text-amber-600 border-amber-100",
      dot: "bg-amber-500",
    },
  ];

  return (
    <Section className="max-w-5xl mx-auto">
      {/* title */}
      <Title title="تلائم أهدافك وتحقق نتائجك" subTitle="مجالات واسعة" />
      {/* event card */}
      {campaign && <EventCard campaign={campaign} />}
      {/* cards */}
      {/* handle better instead of just hide */}
      <div className="hidden md:block space-y-5">
        {/* 1st group */}
        <DivMotion className="grid grid-cols-1 sm:grid-cols-5 gap-5 mx-5 :mx-3">
          <div className="sm:col-span-3">
            <Card
              href={url(CategoriesType.PSYCHIC)}
              variant="white"
              bg="blue"
              title="استشارات نفسية"
              description="اعمل على تعزيز صحتك النفسية واتخذ قراراتك بثقة مع مستشار نفسي متخصص، يوفر لك استشارات فورية، احترافية، وخصوصية كاملة"
              iconSrc={Psychic}
              iconType="svg"
              button={<Button variant="secondary">اختر موعدك القادم</Button>}
            />
          </div>
          <div className="hidden sm:block sm:col-span-2">
            <Card src="/layout/categories-1.png" />
          </div>
        </DivMotion>
        {/* 2st group */}
        <DivMotion className="grid grid-cols-1 sm:grid-cols-3 gap-5 mx-5 :mx-3">
          <Card
            href={url(CategoriesType.FAMILY)}
            title="استشارات أسرية"
            description="استشارة أسرية من مختصين موثوقين، توفر لك الخصوصية، الحلول الواقعية، والدعم النفسي للأفراد والعائلة"
            iconSrc={Family}
            iconType="svg"
            button={
              <Button className="bg-gray-500 text-white border border-white">
                تمتّع بخدمتك الآن
              </Button>
            }
            src="/layout/categories-2.png"
          />
          <Card
            href={url(CategoriesType.LAW)}
            bg="sky"
            variant="black"
            title="استشارات قانونية"
            description="احصل على استشارة قانونية دقيقة من خبراء معتمدين في الأنظمة واللوائح ، بسرية تامة وسرعة"
            iconType="svg"
            iconSrc={Law}
            button={
              <Button className="px-10" variant="primary">
                ابدأ الآن
              </Button>
            }
          />
          <Card
            href={url(CategoriesType.PERSONAL)}
            title="استشارات شخصية"
            description="طوّر حياتك واتخذ قراراتك بثقة مع استشاري شخصي خبير ، بخصوصية تامة واستشارات فورية احترافية وسرعة"
            Icon={Goal}
            src="/layout/categories-3.png"
            button={
              <Button className="bg-gray-500 text-white border border-white">
                تمتّع بخدمتك الآن
              </Button>
            }
          />
        </DivMotion>
        {/* scales */}
        <ScalesCta />
      </div>
      {/* reserve */}
      <div className="md:hidden flex flex-col items-center gap-6 text-center">
        {/* reserve */}
        <div className="md:hidden relative bg-linear-to-b from-[#34068312] to-[#7E91FF47] p-6 sm:p-8 space-y-5 md:space-y-8 mx-5 :mx-3 rounded-2xl overflow-hidden">
          {/* images style */}
          <Image
            src="/svg/home/home-stars.svg"
            alt="icon"
            width={300}
            height={300}
            className="absolute top-2 left-0"
          />
          <div className="absolute -top-25 -left-25 w-52 h-52 rounded-full border-2 border-[#1480D957]" />
          <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[#1480D957]" />
          <div className="absolute -bottom-80 -right-30 w-80 h-80 rounded-full bg-[#1480D957]" />
          {/* content */}
          <h3 className="text-black text-3xl font-semibold z-20">
            حجزك مع مستشارك خلال دقيقة
          </h3>
          <p className="text-black text-base">
            لا داعي للانتظار، يمكنك بدء جلستك الآن مع أحد مستشارينا بخطوات سهلة
            وسريعة تمنحك الراحة والطمأنينة.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            {categories.map((cat) => (
              <a
                key={cat.id}
                href={`/consultants?categories=${cat.id}`}
                className={`
                inline-flex items-center gap-2 rounded-full border px-4 py-2
                text-sm font-semibold transition-all duration-200
                hover:scale-105 hover:shadow-md active:scale-100
                ${cat.style}
              `}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${cat.dot} shrink-0`}
                />
                {cat.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Categories;
