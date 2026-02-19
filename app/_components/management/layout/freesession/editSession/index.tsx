"use client";
// React & Next
import React from "react";

// components
import EditFreeSessionForm from "./form";
import { ZSection } from "@/app/_components/layout/section";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// utils
import { findUser } from "@/utils";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { FreeSession } from "@/lib/generated/prisma/client";


// types
type Session = (FreeSession & { consultant: { name: string } })

// props
interface Props {
  lang?: "en" | "ar";
  role: UserRole;
  session: Session;
}

export default function EditFreeSession({ session, lang, role }: Props) {
  // check langauge
  const isEn = !lang || lang === "en";

  // return
  return (
    <ZSection>
      <div
        className="max-w-4xl sm:w-10/12 mx-auto space-y-10"
        dir={isEn ? "ltr" : "rtl"}
      >
        <a
          href={`${findUser(role)?.url}/freesessions`}
          className="flex flex-row gap-1 items-center w-fit"
        >
          {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          <h5 className="pt-1">{isEn ? "sessions" : "الرجوع للجلسات"}</h5>
        </a>
        <div className="w-10/12 mx-auto space-y-10">
          <h3 className="text-lg capitalize">
            {isEn ? "edit session" : "تعديل الجلسة"} #{session?.fid}
          </h3>
          <EditFreeSessionForm session={session} lang={lang} />
        </div>
      </div>
    </ZSection>
  );
}
