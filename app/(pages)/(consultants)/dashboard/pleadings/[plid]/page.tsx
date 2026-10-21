// React & Next
import { notFound } from "next/navigation";

// components
import { CaseChat } from "@/components/clients/pleading/case-chat";
import { CasePanel } from "@/components/consultant/pleadings/case-panel";

// prisma data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getPleadingForConsultant } from "@/data/pleading";
import { listPleadingDocuments } from "@/data/pleading-documents";

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

  // the engagement agreement versions (newest first); the newest prefills a re-quote
  const documents = await listPleadingDocuments(pleading.id);
  const latest = documents[0];
  const agreement = latest
    ? {
        caseType: latest.caseType ?? "",
        summary: latest.summary ?? "",
        consultantTerms: Array.isArray(latest.consultantTerms)
          ? latest.consultantTerms.filter((t): t is string => typeof t === "string")
          : [],
        notes: latest.notes ?? "",
      }
    : null;
  const versions = documents.map((d) => ({
    id: d.id,
    version: d.version,
    state: d.state,
    fileUrl: d.fileUrl,
    stuck: d.stuck,
  }));

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
          agreement={agreement}
          versions={versions}
        />
      </div>
    </div>
  );
}
