"use server";
// React & Next
import React from "react";

// components
import { Btitle } from "@/components/legacy/layout/titles";
import Custom404 from "@/components/legacy/layout/notFound";
import { Section } from "@/components/legacy/layout/section";
import OwnerTimings from "@/components/legacy/consultants/owner/timings";
import { OwnerIsDisabled } from "@/components/legacy/layout/zStatus";

// lib
import { userServer } from "@/lib/auth/server";

// db data
import { getOwnerbyAuthor } from "@/data/consultant";

// icons
import { Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

export default async function Page() {
  // get user
  const user = await userServer();

  // get author id
  const author = user?.id;

  // if author
  if (!author) return <Custom404 />;

  // get owners status
  const owner = await getOwnerbyAuthor(author);

  // check if consultant true status & get old slection times
  if (!owner) return <OwnerIsDisabled owner={owner} />;

  // show timings
  return (
    <Section>
      {/* title */}
      <Btitle
        title="المواقيت"
        subtitle="مواقيت الاستشارات المتوقع التواجد فيها"
      />
      {/* timings */}
      <Card className="rounded-xl p-5 min-w-60 max-w-5xl mx-auto">
        <CardHeader>
          <CardDescription></CardDescription>
        </CardHeader>
        {/* title */}
        <CardContent>
          <div className="flex flex-col gap-1">
            <h3 className="flex flex-row items-center gap-1 text-zblue-200 font-bold text-2xl text-right">
              <Clock /> اختيار المواقيت
            </h3>
            <h6 dir="rtl" className="text-zgrey-100 text-sm font-semibold mb-3">
              برجاء اختيار المواعيد المناسبة معك اليوم{" "}
            </h6>
            {/* map times */}
          </div>
          {/* times */}
          <OwnerTimings author={author} cid={owner?.cid} />
          {/* hint */}
          <h6 dir="rtl" className="text-xs text-zgrey-100">
            المواعيد بتوقيت الرياض - المملكة العربية السعودية
          </h6>
          {/* confirm picking */}
        </CardContent>
      </Card>
    </Section>
  );
}
