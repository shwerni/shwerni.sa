// React & Next
import { notFound } from "next/navigation";

// components
import { CaseChat } from "@/components/clients/pleading/case-chat";
import { CasePanel } from "@/components/consultant/pleadings/case-panel";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getPleadingForConsultant } from "@/data/pleading";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { Categories, UserRole } from "@/lib/generated/prisma/enums";

interface Props {
  params: Promise<{ plid: string }>;
}

// one pleading case: the case chat and the consultant's panel (quote, decline)
export default async function PleadingCasePage({ params }: Props) {
  const plid = Number((await params).plid);
  if (!Number.isInteger(plid) || plid <= 0) notFound();

  const user = await userServer();
  if (!user?.id) notFound();

  const consultant = await getOwnerbyAuthor(user.id);
  if (!consultant || consultant.category !== Categories.LAW) notFound();

  // ownership by the session user; another consultant's case looks like a missing one
  const pleading = await getPleadingForConsultant(plid, user.id);
  if (!pleading) notFound();

  // formatted here, in riyadh time, so the client markup matches the server's
  const requestedOn = pleading.requestedAt
    ? pleading.requestedAt.toLocaleDateString("en-CA", {
        timeZone: "Asia/Riyadh",
      })
    : null;

  return (
    <div
      className="max-w-6xl mx-auto px-0 sm:px-4 pb-6 grid gap-4 lg:grid-cols-[1fr_20rem]"
      dir="rtl"
    >
      <CaseChat
        plid={pleading.plid}
        role={UserRole.OWNER}
        counterpart={{ name: pleading.name }}
        backHref="/dashboard/pleadings"
        className="sm:border sm:rounded-xl overflow-hidden"
      />
      <div className="px-3 sm:px-0">
        <CasePanel
          plid={pleading.plid}
          clientName={pleading.name}
          requestedOn={requestedOn}
        />
      </div>
    </div>
  );
}
