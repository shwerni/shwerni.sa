// React & Next
import Link from "next/link";

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
import { getActiveCampaignFor } from "@/data/event";

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

  const campaign = await getActiveCampaignFor("HOME_CARD");

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
      // brand theme — follows --theme in globals.css
      iconBg: "bg-theme/15",
      iconColor: "text-theme",
      style: "bg-theme-50 text-theme border-theme/20",
      dot: "bg-theme",
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

  // mobile trust points — same promises the desktop cards make
  // const trust = [
  //   { icon: ShieldCheck, label: "خصوصية تامة" },
  //   { icon: BadgeCheck, label: "مستشارون معتمدون" },
  //   { icon: Clock, label: "حجز خلال دقيقة" },
  // ];

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

      {/* ---------- mobile ---------- */}
      <div className="md:hidden mx-4">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          {/* header */}
          <div className="flex items-center justify-between gap-3 bg-linear-to-l from-theme to-theme-900 px-4 py-3 text-white">
            <div className="min-w-0">
              <h3 className="text-sm font-bold">احجز مع مستشارك خلال دقيقة</h3>
              <p className="text-[11px] text-white/75">
                خصوصية تامة · مستشارون معتمدون
              </p>
            </div>
            <Link
              href="/discover"
              className="shrink-0 rounded-lg bg-white px-3 py-1.5 text-xs font-bold text-theme transition-transform active:scale-95"
            >
              احجز الآن
            </Link>
          </div>

          {/* categories */}
          {/* categories — single row */}
          <div className="grid grid-cols-4 gap-1 p-3">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={url(cat.id)}
                className="flex flex-col items-center gap-1.5 rounded-xl py-2 transition-colors active:bg-gray-50"
              >
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.iconBg}`}
                >
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                </span>
                <span className="text-center text-[11px] font-semibold leading-tight text-gray-800">
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

export default Categories;
