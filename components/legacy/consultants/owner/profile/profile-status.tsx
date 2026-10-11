"use client";
// components
import ConsultantInfoCard from "../marketingCard";
import Togglevisibility from "@/components/legacy/consultants/owner/profile/toggle-visibility";
import { PleadingOptIn } from "@/components/consultant/pleadings/opt-in";

// prisma types
import {
  ApprovalState,
  Categories,
  ConsultantState,
} from "@/lib/generated/prisma/enums";
import { Consultant } from "@/lib/generated/prisma/client";

// icons
import { LucideMessageCircleWarning } from "lucide-react";

// props
interface Props {
  author: string;
  consultant: Consultant | null | undefined;
}

// visibility toggle + marketing card, or a prompt to create the listing
export function ProfileStatus({ author, consultant }: Props) {
  // listing not created yet
  if (!consultant) {
    return (
      <div className="flex flex-row items-start gap-2 rounded-xl bg-red-50 p-4">
        <LucideMessageCircleWarning className="shrink-0 text-red-500" />
        <div className="flex flex-col gap-1">
          <h3>لم يتم إنشاء إعلانك بعد</h3>
          <p className="text-sm">أكمل البيانات أدناه ثم اضغط «إنشاء الإعلان»</p>
        </div>
      </div>
    );
  }

  // published listing
  const isLive =
    consultant.approved === ApprovalState.APPROVED &&
    consultant.statusA === ConsultantState.PUBLISHED;

  return (
    <>
      <Togglevisibility
        author={author}
        cid={consultant.cid}
        state={consultant.status}
        stateA={consultant.statusA}
        approved={consultant.approved}
        adminNote={consultant.adminNote}
      />
      {/* pleading requests opt-in (LAW consultants only) */}
      {consultant.category === Categories.LAW && (
        <PleadingOptIn enabled={consultant.pleadingEnabled} />
      )}
      {isLive && (
        <ConsultantInfoCard
          cid={consultant.cid}
          name={consultant.name}
          image={consultant.image ?? ""}
          about={consultant.nabout}
          experience={consultant.nexperiences}
          education={consultant.neducation}
          gender={consultant.gender}
        />
      )}
    </>
  );
}
