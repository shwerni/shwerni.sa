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
import { meetingLabel } from "@/utils/time";

// props
interface Props {
  cid: number;
}

const UpcomingFreeSessions: React.FC<Props> = async ({ cid }) => {
  // upcoming sessions
  const sessions = await getOwnerFreeSessions(cid);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base text-zblue-200">
          الجلسات القادمة
        </CardTitle>
        <CardDescription />
        <CardContent className="space-y-3">
          {sessions && sessions.length > 0 ? (
            sessions.map((i, index) => (
              <div key={index} className="space-y-2 w-72">
                <h3>
                  {i.name} | {i.fid}
                </h3>
                <h6>{meetingLabel(i.time, i.date)}</h6>
                <Separator className="w-10/12 max-w-40 mx-auto" />
              </div>
            ))
          ) : (
            <h3 className="mx-auto text-center px-10 py-5">
              لا يوجد جلسات قادمة
            </h3>
          )}
        </CardContent>
      </CardHeader>
    </Card>
  );
};

export default UpcomingFreeSessions;
