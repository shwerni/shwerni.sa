// components
import Section from "../shared/section";
import Error404 from "@/components/shared/error-404";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import CopyButton from "@/components/shared/copy-button";
import { LinkButton } from "@/components/shared/link-button";

// prisma data

// utils
import { meetingTime, meetingFullLabel } from "@/utils/date";

// types

// prisma types
import { FreeSession } from "@/lib/generated/prisma/client";

// icons
import {
  Ban,
  Check,
  CircleAlert,
  Video,
  Users,
  CalendarCheck,
  UserCheck,
  ExternalLink,
} from "lucide-react";

// props
interface Props {
  zid: string;
  date: string;
  time: string;
  freesession: FreeSession & { consultant: { name: string; phone: string } };
}

export default async function Meetings({
  zid,
  time,
  date,
  freesession,
}: Props) {
  // url
  const url = "/freesessions/rooms/" + zid;

  // meetings status
  const mStatus = meetingTime(time, date, freesession.time, freesession.date);

  // validet
  if (!freesession) return <Error404 />;

  // label
  const label = meetingFullLabel(freesession.date, freesession.time);

  // return
  return (
    <Section className="space-y-10">
      {/* meeting title */}
      <div>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2">
            <Video className="w-6 h-6 text-theme" />
            <h3 className="sm:text-2xl text-xl font-bold text-theme">اجتماع</h3>
          </div>
          <div className="h-0.5 sm:w-24 w-16 mt-1.5 bg-theme rounded-full" />
        </div>

        {/* meeting owner & user */}
        <div className="flex flex-row justify-center items-center gap-2 mx-auto my-3">
          <div className="flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-muted-foreground" />
            <h5 className="text-xs font-semibold text-foreground">
              {freesession.name}
            </h5>
          </div>
          <Separator className="h-5 w-px bg-border" orientation="vertical" />
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <h5 className="text-xs font-semibold text-foreground">
              المستشار {freesession.consultant.name}
            </h5>
          </div>
        </div>
      </div>

      {/* meetings status */}
      <div className="space-y-4">
        {/* meeting status card */}
        <Card className="w-10/12 max-w-xs mx-auto">
          <CardContent className="pt-4 pb-4 space-y-3">
            <div className="flex items-center justify-center gap-1.5">
              <CalendarCheck className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-semibold text-primary">
                حالة الإجتماع
              </h3>
            </div>

            {/* on time */}
            {mStatus === true && (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                  <Check className="text-green-500 w-8 h-8" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  لقد حضرت في الموعد
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  اضغط علي التحويل التلقائي او انسخ رابط غرفة الإجتماع المباشر
                </p>
              </div>
            )}

            {/* late */}
            {mStatus === false && (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                  <Ban className="text-red-500 w-8 h-8" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  انتهى موعد الإجتماع
                </h3>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            )}

            {/* early */}
            {mStatus === null && (
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center">
                  <CircleAlert className="text-amber-500 w-8 h-8" />
                </div>
                <h3 className="text-sm font-medium text-foreground">
                  لم يبدأ الإجتماع
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  الإجتماع سيبدأ تلقائيا قبل الموعد بخمس دقائق
                </p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* room URL - only shown on time */}
        {url && mStatus === true && (
          <div className="grid grid-cols-2 gap-3 max-w-xs mx-auto">
            <div className="flex flex-col items-center gap-1.5">
              <LinkButton href={url} variant="primary" className="gap-2">
                <ExternalLink />
                الأنتقال الي الإجتماع
              </LinkButton>
              <p className="text-[10px] text-muted-foreground text-center">
                التحويل التلقائي للإجتماع
              </p>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <CopyButton value={url} label="نسخ رابط الأجتماع" />
              <p className="text-[10px] text-muted-foreground text-center">
                نسخ الرابط المباشر لغرفة الإجتماع
              </p>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
}
