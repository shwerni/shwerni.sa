// React & Next
import type { Metadata } from "next";
import { notFound } from "next/navigation";

// components
import UploadThingWrapper from "@/components/wrappers/uploadthing";
import { CaseChat } from "@/components/clients/pleading/case-chat";
import { ClientPanel } from "@/components/clients/pleading/client-panel";

// prisma data
import { getClientPleading } from "@/data/pleading";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { clientTokenSchema } from "@/utils/pleading";

// a private page reached by the client's link: never indexed, not in the sitemap, and no
// referer, so the token in the url doesn't leave the site
export const metadata: Metadata = {
  title: "طلب المرافعة",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

interface Props {
  params: Promise<{ token: string }>;
}

// the client's case page (guest or signed in): the link token is the identity. the token goes
// only to the chat and the panel, which need it to poll and act; nothing else renders it
export default async function PleadingClientPage({ params }: Props) {
  const parsed = clientTokenSchema.safeParse((await params).token);
  if (!parsed.success) notFound();

  const token = parsed.data;
  const pleading = await getClientPleading(token);
  if (!pleading) notFound();

  const { consultant } = pleading;

  return (
    <UploadThingWrapper>
      <div
        className="max-w-6xl mx-auto px-0 sm:px-4 py-6 grid gap-4 lg:grid-cols-[1fr_22rem]"
        dir="rtl"
      >
        <div className="order-2 lg:order-1">
          <CaseChat
            plid={pleading.plid}
            role={UserRole.USER}
            token={token}
            counterpart={{
              name: consultant.name,
              image: consultant.image,
              gender: consultant.gender,
            }}
            className="sm:border sm:rounded-xl overflow-hidden"
          />
        </div>
        <div className="order-1 lg:order-2 px-3 sm:px-0">
          <ClientPanel
            plid={pleading.plid}
            token={token}
            consultant={{
              name: consultant.name,
              title: consultant.title,
              image: consultant.image,
              gender: consultant.gender,
            }}
          />
        </div>
      </div>
    </UploadThingWrapper>
  );
}
