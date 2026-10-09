// React & Next
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

// components
import { serverIcon } from "@/components/shared/server-icon";
import { PleadingConsultantCard } from "@/components/clients/pleading/card";
import { CollectionJsonLd } from "@/components/seo/collection-json-ld";

// prisma data
import { getPleadingConsultants } from "@/data/consultant";

// constants
import { mainRoute } from "@/constants/links";
import { defaultMetaApi } from "@/constants";

// icons: plain server svgs (no client component)
import { __iconNode as fileTextNode } from "lucide-react/dist/esm/icons/file-text.mjs";
import { __iconNode as replyNode } from "lucide-react/dist/esm/icons/message-square-reply.mjs";
import { __iconNode as calendarNode } from "lucide-react/dist/esm/icons/calendar-check.mjs";
import { __iconNode as videoNode } from "lucide-react/dist/esm/icons/video.mjs";
import { __iconNode as scaleNode } from "lucide-react/dist/esm/icons/scale.mjs";
import { __iconNode as shieldNode } from "lucide-react/dist/esm/icons/shield-check.mjs";
const FileText = serverIcon("file-text", fileTextNode);
const Reply = serverIcon("message-square-reply", replyNode);
const CalendarCheck = serverIcon("calendar-check", calendarNode);
const Video = serverIcon("video", videoNode);
const Scale = serverIcon("scale", scaleNode);
const ShieldCheck = serverIcon("shield-check", shieldNode);

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
const title = "مرافعة: عرض قضيتك على مستشار قانوني";
const fullTitle = `${title} | شاورني`;
const description =
  "اعرض ملخص قضيتك ومستنداتك على مستشار قانوني في شاورني، واحصل على رده وسعر الجلسة قبل الحجز، ثم احجز جلسة استشارية مدتها 60 دقيقة لمناقشة قضيتك.";
const url = `${mainRoute}pleading`;

export const metadata: Metadata = {
  title,
  description,
  keywords: [
    "مرافعة",
    "استشارة قانونية",
    "محامي",
    "مستشار قانوني",
    "قضية",
    "استشارة قانونية أونلاين",
    "شاورني",
  ],
  alternates: { canonical: url },
  openGraph: {
    ...defaultMetaApi.openGraph,
    title: fullTitle,
    description,
    url,
  },
  twitter: {
    ...defaultMetaApi.twitter,
    title: fullTitle,
    description,
  },
};

// how it works, in order
const steps = [
  {
    icon: FileText,
    title: "أرسل طلبك",
    text: "اختر المستشار، واكتب ملخص قضيتك وأرفق مستنداتك (حتى 5 ملفات).",
  },
  {
    icon: Reply,
    title: "رد المستشار والسعر",
    text: "يطّلع المستشار على قضيتك ويرد عليك برأيه وسعر الجلسة، ويصلك الرد برابط خاص على واتساب.",
  },
  {
    icon: CalendarCheck,
    title: "احجز وادفع",
    text: "اختر الموعد المناسب وأكمل الدفع بسعر العرض. صلاحية العرض 7 أيام.",
  },
  {
    icon: Video,
    title: "الجلسة",
    text: "جلسة مدتها 60 دقيقة مع المستشار لمناقشة قضيتك بالتفصيل.",
  },
];

// the opted-in LAW consultants; invalidated by togglePleading (the consultant's opt-in switch)
const fetchPleadingConsultants = async () => {
  "use cache";
  cacheTag("pleading-consultants");
  cacheLife("hours");
  return getPleadingConsultants();
};

export default async function Page() {
  const consultants = await fetchPleadingConsultants();

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-5 py-10 space-y-12">
      <CollectionJsonLd
        path="pleading"
        name={fullTitle}
        description={description}
        items={consultants.map((c) => ({
          name: c.name,
          path: `consultants/${c.cid}`,
        }))}
      />

      {/* header */}
      <section className="relative bg-linear-to-b from-[#34068312] to-[#7E91FF47] px-6 sm:px-8 py-14 rounded overflow-hidden space-y-4 text-center">
        <Scale className="mx-auto size-10 text-theme-700" />
        <h1 className="text-theme-700 text-3xl font-semibold">مرافعة</h1>
        <p className="text-gray-800 text-base max-w-2xl mx-auto leading-8">
          اعرض قضيتك على مستشار قانوني قبل أن تحجز: ترسل ملخص القضية
          ومستنداتك، فيطّلع عليها المستشار ويرد عليك برأيه وسعر الجلسة، ثم تحجز
          جلسة مدتها 60 دقيقة لمناقشة قضيتك بالتفصيل.
        </p>
      </section>

      {/* how it works */}
      <section aria-labelledby="pleading-steps" className="space-y-6">
        <h2
          id="pleading-steps"
          className="text-2xl font-bold text-gray-800 text-center"
        >
          كيف تعمل المرافعة؟
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="rounded-xl border border-gray-200 bg-white p-5 space-y-3"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-theme-50 text-theme-700 font-semibold tabular-nums">
                  {index + 1}
                </span>
                <step.icon className="size-5 text-theme-700" />
              </div>
              <h3 className="font-semibold text-gray-900">{step.title}</h3>
              <p className="text-sm text-gray-600 leading-7">{step.text}</p>
            </li>
          ))}
        </ol>
        <p className="flex items-start justify-center gap-2 text-sm text-gray-500 text-center max-w-2xl mx-auto">
          <ShieldCheck className="size-4 shrink-0 mt-1 text-theme-700" />
          تتم المحادثة مع المستشار داخل شاورني فقط، ولا يُسمح بتبادل وسائل
          التواصل الخارجية قبل الحجز أو بعده.
        </p>
      </section>

      {/* consultants */}
      <section aria-labelledby="pleading-consultants" className="space-y-6">
        <div className="space-y-2 text-center">
          <h2
            id="pleading-consultants"
            className="text-2xl font-bold text-gray-800"
          >
            المستشارون القانونيون
          </h2>
          <p className="text-sm text-gray-500">
            اطلب مرافعة من أحد المستشارين، أو احجز جلسة مباشرة
          </p>
        </div>

        {consultants.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((consultant) => (
              <PleadingConsultantCard
                key={consultant.cid}
                consultant={consultant}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-gray-200 bg-white py-14 px-6 text-center">
            <Scale className="size-8 text-gray-300" />
            <p className="font-semibold text-gray-600">
              لا يوجد مستشارون متاحون للمرافعة حالياً
            </p>
            <p className="text-sm text-gray-400">
              يمكنك تصفح المستشارين القانونيين وحجز جلسة مباشرة من صفحة
              المستشارين
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
