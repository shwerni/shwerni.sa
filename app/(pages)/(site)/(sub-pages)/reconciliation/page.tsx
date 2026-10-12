// React & Next
import type { Metadata } from "next";
import { Suspense } from "react";
import { connection } from "next/server";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Section from "@/components/clients/shared/section";
import CardSkeleton from "@/components/clients/shared/card-skeleton";
import { ReconciliationBookingForm } from "@/components/clients/reconciliation/booking-form";

// prisma data
import {
  getConsultantInfoForBooking,
  getUnavailableWeekdays,
} from "@/data/consultant";
import {
  getFinanceConfig,
  getReconciliationConfig,
} from "@/data/admin/settings/finance";

// icons
import {
  Handshake,
  Heart,
  Shield,
  Sparkles,
  Video,
  Users,
  CircleAlert,
} from "lucide-react";

// meta data seo: extends defaultMetaApi (root layout); the title template adds "| شاورني"
export const metadata: Metadata = {
  title: "بيننا: جلسات الصلح",
  description:
    "جلسات إصلاح وإرشاد يديرها مختصون لمساعدة الأزواج والعائلات والمتخاصمين على الوصول لحل عادل وهادئ.",
};

// the booking: the consultant, price and share come from the finance settings at request time
// (connection(): never baked into the build), with the consultant's open weekdays
async function ReconciliationBooking() {
  await connection();

  const config = await getReconciliationConfig();
  const [consultant, unavailable, finance] = config.cid
    ? await Promise.all([
        getConsultantInfoForBooking(config.cid),
        getUnavailableWeekdays(config.cid),
        getFinanceConfig(),
      ])
    : [null, [], null];

  if (!config.cid || !consultant || !finance)
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CircleAlert className="w-8 h-8 text-gray-300" />
        <p className="font-semibold text-gray-600">
          خدمة جلسات الصلح غير متاحة حالياً
        </p>
      </div>
    );

  return (
    <ReconciliationBookingForm
      cid={config.cid}
      consultant={consultant.name}
      price={config.price}
      finance={finance}
      unavailable={[...unavailable]}
    />
  );
}

export default function Page() {
  return (
    <Section className="space-y-12 relative pb-16">
      {/* Background Blurs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-72 h-72 bg-theme/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-64 h-64 bg-teal-500/5 rounded-full blur-3xl" />
      </div>

      {/* Hero Header Section */}
      <div className="max-w-4xl mx-auto text-center space-y-6 pt-8">
        <div className="flex items-center justify-center gap-4">
          <h1 className="text-4xl lg:text-6xl font-black text-theme leading-tight">
            بيننا
          </h1>
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl bg-theme/10 flex items-center justify-center shadow-inner">
            <Handshake className="w-8 h-8 lg:w-9 lg:h-9 text-theme" />
          </div>
        </div>

        <div className="inline-flex items-center gap-2 bg-theme/5 border border-theme/10 rounded-full px-5 py-2.5 shadow-sm">
          <Sparkles className="w-4 h-4 text-theme" />
          <span className="text-sm font-semibold text-gray-700">
            الخلاف بينكم.. والحل بيننا
          </span>
        </div>

        <p className="text-base lg:text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto font-medium">
          لأن الخلافات جزء من العلاقات، أطلقنا خدمة{" "}
          <span className="text-theme font-bold">بيننا</span> لمساعدتكم على
          الوصول لحل عادل وهادئ. جلسات إصلاح وإرشاد يديرها مختصون، نعيد فيها
          الحوار، نخفف التوتر، ونساعد الطرفين على الفهم والتوافق بدون ضغط أو
          أحكام.
        </p>

        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          {[
            { icon: Heart, label: "جلسات مصالحة" },
            { icon: Video, label: "عبر الإنترنت" },
            { icon: Shield, label: "سرية تامة" },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 bg-white border border-gray-100 rounded-full px-5 py-2.5 shadow-sm text-gray-700"
            >
              <feature.icon className="w-4 h-4 text-theme" />
              <span className="text-sm font-bold">{feature.label}</span>
            </div>
          ))}
        </div>

        {/* Target Audience Grid */}
        <div className="mt-12 bg-white/60 backdrop-blur-md rounded-3xl p-8 border border-gray-100 shadow-sm relative z-10">
          <div className="text-center mb-8">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2 flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-theme" />
              لمن هذه الخدمة؟
            </h3>
            <p className="text-gray-500 text-sm">
              نقدم خدماتنا لكل من يبحث عن السلام والتفاهم
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "الأزواج", icon: Heart, desc: "لحل الخلافات الزوجية" },
              { label: "المخطوبين", icon: Sparkles, desc: "لبداية سليمة" },
              { label: "أفراد العائلة", icon: Users, desc: "لإصلاح العلاقات" },
              { label: "المتخاصمين", icon: Handshake, desc: "للصلح والتفاهم" },
            ].map((item) => (
              <div
                key={item.label}
                className="group relative bg-white rounded-2xl p-5 text-center hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-theme/30"
              >
                <div className="w-12 h-12 mx-auto mb-3 bg-gray-50 rounded-xl flex items-center justify-center group-hover:bg-theme/10 group-hover:scale-105 transition-all">
                  <item.icon className="w-6 h-6 text-theme opacity-80 group-hover:opacity-100" />
                </div>
                <h4 className="font-bold text-gray-800 mb-1">{item.label}</h4>
                <p className="text-xs text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* the booking */}
      <Card className="max-w-4xl mx-auto shadow-lg border-gray-100 overflow-hidden relative z-10">
        <div className="h-1.5 w-full bg-theme" /> {/* Top accent line */}
        <CardHeader className="pb-0 hidden">
          <CardTitle />
          <CardDescription />
        </CardHeader>
        <CardContent className="p-6 sm:p-10">
          <Suspense fallback={<CardSkeleton count={1} className="w-full" />}>
            <ReconciliationBooking />
          </Suspense>
        </CardContent>
      </Card>
    </Section>
  );
}
