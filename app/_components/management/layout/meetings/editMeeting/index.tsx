// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import { ZSection } from "@/app/_components/layout/section";
import EditMeetingForm from "@/app/_components/management/layout/meetings/editMeeting/form";

// prisma types
import { OrderType, UserRole } from "@/lib/generated/prisma/enums";

// utils
import { isEnglish, findUser } from "@/utils";
import { timeToArabic } from "@/utils/moment";

// icons
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Meeting } from "@/lib/generated/prisma/client";

// props
interface Props {
  role: UserRole;
  client: string;
  consultant: string;
  meeting: Meeting;
  meetings: Meeting[];
  type: OrderType;
  lang?: "en" | "ar";
}

export default async function EditMeeting({
  role,
  client,
  consultant,
  meeting,
  meetings,
  type,
  lang,
}: Props) {
  // check language
  const isEn = isEnglish(lang);
  // return
  return (
    <ZSection>
      <div className="space-y-8" dir={isEn ? "ltr" : "rtl"}>
        {/* edit meeting     */}
        <div className="max-w-4xl sm:w-10/12 mx-auto space-y-10">
          <a
            href={`${findUser(role)?.url}/meetings`}
            className="flex flex-row gap-1 items-center w-fit"
          >
            {isEn ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            <h5 className="pt-1">{isEn ? "meetings" : "الرجوع للاجتماعات"}</h5>
          </a>
          <div className="w-10/12 mx-auto space-y-10">
            <h3 className="text-lg capitalize">
              {isEn ? "edit meeting" : "تعديل الاحتماع"} #{meeting.orderId}
            </h3>
            <EditMeetingForm
              client={client}
              consultant={consultant}
              type={type}
              meeting={meeting}
              lang={lang}
            />
          </div>
        </div>
        {/* separator */}
        <Separator className="w-10/12 max-w-xl mx-auto" />
        {/* map meetings */}
        <div className="grid grid-cols-3 justify-items-center w-10/12 max-w-xl gap-5 mx-auto">
          {meetings.map((i, index) => (
            <div
              key={index}
              className="flex items-center gap-3 w-42 h-14 bg-white px-2 rounded-lg"
            >
              <h6 className="text-lg text-slate-500">{i.session}. </h6>
              <a
                className="text-slate-700"
                href={`${findUser(role)?.url}meetings/${i.orderId}?session=${i.session}`}
              >
                {i.date} | {isEn ? i.time : timeToArabic(i.time)}
              </a>
            </div>
          ))}
        </div>
      </div>
    </ZSection>
  );
}
