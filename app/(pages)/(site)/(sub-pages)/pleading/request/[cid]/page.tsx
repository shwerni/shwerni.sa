// React & Next
import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";
import { notFound } from "next/navigation";

// components
import UploadThingWrapper from "@/components/wrappers/uploadthing";
import { CategoryBadge } from "@/components/shared/categories-badge";
import ConsultantImage from "@/components/clients/shared/consultant-image";
import { PleadingRequestForm } from "@/components/clients/pleading/request-form";

// prisma data
import { getPleadingConsultant } from "@/data/pleading";

// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

// a form for one consultant: not a search landing page
export const metadata: Metadata = {
  title: "طلب مرافعة",
  description: "أرسل ملخص قضيتك ومستنداتك إلى المستشار القانوني.",
  robots: { index: false, follow: true },
};

interface Props {
  params: Promise<{ cid: string }>;
}

// only a consultant who can receive pleading requests (public, LAW, opted in); invalidated by
// the consultant's opt-in switch
const fetchPleadingConsultant = async (cid: number) => {
  "use cache";
  cacheTag("pleading-consultants");
  cacheLife("hours");
  return getPleadingConsultant(cid);
};

export default async function PleadingRequestPage({ params }: Props) {
  const cid = Number((await params).cid);
  if (!Number.isInteger(cid) || cid <= 0) notFound();

  const consultant = await fetchPleadingConsultant(cid);
  if (!consultant) notFound();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-5 py-10 space-y-8">
      {/* header */}
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-800">طلب مرافعة</h1>
        <p className="text-sm text-gray-500">
          اكتب ملخص قضيتك وأرفق مستنداتك، وسيرد عليك المستشار برأيه وسعر الجلسة
        </p>
      </div>

      {/* the consultant */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
        <ConsultantImage
          name={consultant.name}
          image={consultant.image}
          gender={consultant.gender}
          size="sm"
        />
        <div className="min-w-0 space-y-1">
          <h2 className="font-semibold text-theme-700 truncate">
            {consultant.name}
          </h2>
          {consultant.title && (
            <p className="text-xs text-slate-500 line-clamp-1">
              {consultant.title}
            </p>
          )}
          <CategoryBadge category={Categories.LAW} size="xs" />
        </div>
      </div>

      <UploadThingWrapper>
        <PleadingRequestForm cid={consultant.cid} />
      </UploadThingWrapper>
    </div>
  );
}
