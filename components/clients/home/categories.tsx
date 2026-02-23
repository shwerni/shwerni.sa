// components
import { Button } from "@/components/ui/button";
import Card from "@/components/clients/shared/card";
import Title from "@/components/clients/shared/titles";
import DivMotion from "@/components/shared/div-motion";
import Section from "@/components/clients/shared/section";

// icons
import { Goal } from "lucide-react";

// prisma types
import { Categories as CategoriesType } from "@/lib/generated/prisma/enums";

// svg
import Law from "@/public/svg/icons/categories-law.svg";
import Family from "@/public/svg/icons/categories-family.svg";
import Psychic from "@/public/svg/icons/categories-psychic.svg";

const Categories = () => {
  // link
  const url = (category: CategoriesType) => {
    return `/consultants?categories=${category}`;
  };

  return (
    <Section className="max-w-5xl mx-auto">
      {/* title */}
      <Title title="تلائم أهدافك وتحقق نتائجك" subTitle="مجالات واسعة" />
      {/* cards */}
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
    </Section>
  );
};

export default Categories;
