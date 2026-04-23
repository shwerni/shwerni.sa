// React & Next
import Image from "next/image";

// components
import { Button } from "@/components/ui/button";
import Card from "@/components/clients/shared/card";
import Title from "@/components/clients/shared/titles";
import DivMotion from "@/components/shared/div-motion";
import Section from "@/components/clients/shared/section";
import { IconLabel } from "@/components/shared/icon-label";
import { LinkButton } from "@/components/shared/link-button";

// icons
import {
  ArrowLeft,
  Award,
  Brain,
  Clock,
  Goal,
  Scale,
  ShieldCheck,
  Users,
  Zap,
} from "lucide-react";

// prisma types
import { Categories as CategoriesType } from "@/lib/generated/prisma/enums";

// svg
import Law from "@/public/svg/icons/categories-law.svg";
import Family from "@/public/svg/icons/categories-family.svg";
import Psychic from "@/public/svg/icons/categories-psychic.svg";

const Categories = () => {
  const url = (category: CategoriesType) => {
    return `/consultants?categories=${category}`;
  };

  const trust = [
    { icon: Zap, label: "جلسة فورية خلال دقائق" },
    { icon: ShieldCheck, label: "خصوصية تامة مضمونة" },
    { icon: Clock, label: "متاح 24/ 7" },
  ];
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
      {/* <EventCard /> */}
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
        <LinkButton
          size="lg"
          variant="primary"
          className="px-10 rounded-xl"
          href="/instant"
        >
          <IconLabel Icon={ArrowLeft} label="ابدأ جلستك الآن" />
        </LinkButton>

        {/* <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          {trust.map(({ icon: Icon, label }) => (
            <span
              key={label}
              className="flex items-center gap-1 sm:gap-1.5 text-xs font-meduim text-gray-400"
            >
              <Icon className="h-3.5 w-3.5 text-gray-300" strokeWidth={2.8} />
              {label}
            </span>
          ))}
        </div> */}
      </div>
    </Section>
  );
};

export default Categories;

function EventCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl mx-5">
      {/* rich gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(135deg, #0f172a 0%, #1e1b4b 40%, #312e81 70%, #4c1d95 100%)",
        }}
      />

      {/* subtle noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* glowing orb top-left */}
      <div
        className="absolute -top-10 -right-10 w-48 h-48 rounded-full opacity-20 blur-3xl"
        style={{ background: "#818cf8" }}
      />
      {/* glowing orb bottom-right */}
      <div
        className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full opacity-15 blur-2xl"
        style={{ background: "#c084fc" }}
      />

      {/* decorative geometric ring */}
      <div
        className="absolute top-4 left-4 w-20 h-20 rounded-full opacity-10 border-2"
        style={{ borderColor: "#818cf8" }}
      />
      <div
        className="absolute top-6 left-6 w-16 h-16 rounded-full opacity-10 border"
        style={{ borderColor: "#c084fc" }}
      />

      {/* content */}
      <div className="relative z-10 px-6 py-7 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* text block */}
        <div className="space-y-3 flex-1">
          {/* badge */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide"
            style={{
              background: "rgba(129,140,248,0.15)",
              color: "#a5b4fc",
              border: "1px solid rgba(129,140,248,0.25)",
            }}
          >
            <span>🔥</span>
            <span>عرض لمدة محدودة</span>
          </div>

          {/* headline */}
          {/* <h3
            className="text-xl sm:text-2xl font-bold leading-snug"
            style={{ color: "#f1f5f9" }}
          >
            عرض شاورني
          </h3> */}

          {/* body lines */}
          <div className="space-y-1.5">
            {/* <p
              className="text-sm font-medium leading-relaxed"
              style={{ color: "#cbd5e1" }}
            >
              نقدّم خصمًا خاصًا لعملائنا
            </p> */}
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium" style={{ color: "#e2e8f0" }}>
                سعر الجلسة{" "}
                <span
                  className="text-lg font-bold px-2 py-0.5 rounded-lg"
                  style={{
                    background: "rgba(129,140,248,0.2)",
                    color: "#a5b4fc",
                  }}
                >
                  89 ريال
                </span>{" "}
                <span style={{ color: "#94a3b8" }}>شامل الضريبة</span>
              </p>
            </div>
          </div>
        </div>

        {/* cta button */}
        <div className="shrink-0">
          <LinkButton
            href="/event"
            className="font-semibold px-6 py-2.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-indigo-500/30 hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              color: "#fff",
              border: "none",
            }}
          >
            احجز الآن
          </LinkButton>
        </div>
      </div>

      {/* bottom shimmer line */}
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, #6366f1, transparent)",
        }}
      />
    </div>
  );
}
