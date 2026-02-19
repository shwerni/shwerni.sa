"use server";
// React & Next
import React from "react";

// components
import EmployeePreConsultationForm from "./form";
import { Separator } from "@/components/ui/separator";
import { ZSection } from "@/app/_components/layout/section";

// prisma types
import { PreConsultation } from "@/lib/generated/prisma/client";

// utils
import { findUser } from "@/utils";
import { dateTimeToString } from "@/utils/moment";

// auth type
import { User } from "next-auth";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

// props
interface Props {
  session: PreConsultation;
  user: User;
  lang?: "en" | "ar";
}

export default async function EmployeeEditPreConsultation({
  session,
  user,
  lang,
}: Props) {
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
          href={`${findUser(user.role)?.url}/orders`}
          className="flex flex-row gap-1 items-center w-fit"
        >
          {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
          <h5 className="pt-1">
            {isEn ? "sessions" : "الرجوع للجلسات التوجيهية"}
          </h5>
        </a>
        <div className="w-10/12 mx-auto space-y-10">
          <div>
            <h3 className="text-lg capitalize">
              {isEn ? "edit session " : "تعديل الجلسة "}#{session?.pid}
            </h3>
            {session.created_at && (
              <h6 className="text-xs font-medium">
                {dateTimeToString(session.created_at)}
              </h6>
            )}
          </div>
          {/* order info */}
          <div className="my-5 space-y-2">
            <h5 className="text-sm">
              {isEn ? "session' info" : "معلومات الجلسة"}
            </h5>
            {/* info */}
            <div className="w-10/12 mx-auto space-y-3">
              {/* order payment details */}
              <h6 className="text-sm font-bold">
                {isEn ? "name" : "الاسم"}: {session.name}
              </h6>
              {/* separator */}
              <Separator className="w-10/12 max-w-40" />
              <p className="w-11/12">{session.issue}</p>
            </div>
          </div>
          {/* separator */}
          <Separator className="w-10/12 max-w-80 mx-auto" />
          {/* order form */}
          <EmployeePreConsultationForm
            session={session}
            advisorId={user.id}
            lang={lang}
          />
        </div>
      </div>
    </ZSection>
  );
}
