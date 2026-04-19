// React & Next
import { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import AwarenessForm from "@/components/clients/sub-pages/marriage-awareness/form";
import ProductCard from "@/components/clients/sub-pages/marriage-awareness/product";
import ConsultantMiniCard from "@/components/clients/sub-pages/marriage-awareness/card";

// prisma data
import { getConsultant, getUnavailableWeekdays } from "@/data/consultant";
import { getFinanceConfig } from "@/data/admin/settings/finance";

// auth
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "مقياس جاهزية الوعي للزواج | منصة شاورني",
  description:
    "اكتشف مدى جاهزيتك النفسية والعاطفية للزواج من خلال مقياس علمي معتمد، مع جلسة استشارية لتحليل النتائج ووضع خطة عملية مخصصة لك عبر منصة شاورني.",
  keywords: [
    "مقياس الزواج",
    "الاستعداد للزواج",
    "الوعي الزواجي",
    "استشارة زواج",
    "اختبار ما قبل الزواج",
    "منصة شاورني",
    "استشارات أسرية",
  ],
  openGraph: {
    title: "مقياس جاهزية الوعي للزواج | منصة شاورني",
    description:
      "اكتشف مدى جاهزيتك النفسية والعاطفية للزواج من خلال مقياس علمي معتمد، مع جلسة استشارية لتحليل النتائج ووضع خطة عملية مخصصة لك.",
    siteName: "منصة شاورني",
    locale: "ar_SA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "مقياس جاهزية الوعي للزواج | منصة شاورني",
    description:
      "اكتشف مدى جاهزيتك النفسية والعاطفية للزواج من خلال مقياس علمي معتمد، مع جلسة استشارية لتحليل النتائج.",
  },
};

export default async function Page() {
  // auth
  const session = await auth();

  // cid
  const cid = 97;

  // fetch the specific consultant who runs this assessment
  const consultant = await getConsultant(cid);

  // get unavailable week days to exclude form calendar
  const unavailable = await getUnavailableWeekdays(cid);

  // get consultant cost
  const cost = 304;

  // get finance
  const finance = await getFinanceConfig();

  if (!consultant || !cost) return <Error404 />;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 space-y-4">
      <ConsultantMiniCard consultant={consultant} />

      <ProductCard />

      <AwarenessForm
        cid={consultant.cid}
        consultant={consultant.name}
        unavailable={unavailable}
        cost={cost}
        finance={finance}
        user={session?.user}
      />
    </div>
  );
}
