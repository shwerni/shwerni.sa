// React & Next
import React from "react";

// components
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

// prisma data
import { getOwnerFreeSessions } from "@/data/freesession";

// utils
import { meetingLabel } from "@/utils/moment";

// props
interface Props {
  cid: number;
}

const UpcomingFreeSessions: React.FC<Props> = async ({ cid }) => {
  // upcoming sessions
  const sessions = await getOwnerFreeSessions(cid);

  return (
    <div className="">
      <Card className="w-fit">
        <CardHeader>
          <CardTitle className="text-base text-zblue-200">
            الجلسات القادمة
          </CardTitle>
          <CardDescription></CardDescription>
          {sessions && sessions.length > 0 ? (
            <CardContent className="space-y-3">
              {sessions.map((i, index) => (
                <div key={index} className="space-y-2 w-11/12 max-w-72">
                  <h3>
                    {i.name} | {i.fid}
                  </h3>
                  <h6>{meetingLabel(i.time, i.date)}</h6>
                  <Separator className="w-10/12 max-w-40 mx-auto" />
                </div>
              ))}
            </CardContent>
          ) : (
            <h3 className="mx-auto text-center px-10 py-5">
              لا يوجد جلسات قادمة
            </h3>
          )}
        </CardHeader>
      </Card>
    </div>
  );
};

export default UpcomingFreeSessions;
