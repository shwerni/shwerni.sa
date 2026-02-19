"use server";
// React & Next
import React from "react";

// components
import { Separator } from "@/components/ui/separator";
import { Btitle } from "@/app/_components/layout/titles";
import Custom404 from "@/app/_components/layout/notFound";
import { Section } from "@/app/_components/layout/section";
import { OwnerIsDisabled } from "@/app/_components/layout/zStatus";
import OwnerFreeSessions from "@/app/_components/consultants/owner/freeSession";
import UpcomingFreeSessions from "@/app/_components/consultants/owner/freeSession/sessions";

// utils
import { userServer } from "@/lib/auth/server";

// db data
import { getOwnerbyAuthor } from "@/data/consultant";
import { getFreeTimingsByAuthor } from "@/data/freesession";

export default async function Page() {
  // get user
  const user = await userServer();

  // get author id
  const author = user?.id;

  // if author
  if (!author) return <Custom404 />;

  // get owners status
  const owner = await getOwnerbyAuthor(author);

  // check if consultant true status & get old selection times
  if (!owner) return <OwnerIsDisabled owner={owner} />;

  // free timings
  const freesession = await getFreeTimingsByAuthor(author);

  // show timings
  return (
    <Section>
      <div className="max-w-5xl space-y-10 mx-auto">
        {/* title */}
        <Btitle
          title="جلسة مجانية"
          subtitle="جلسة مجانية لمدة 20 دقيقة مرة واحدة في الأسبوع"
        />
        {/* content */}
        {/* upcoming free sessions */}
        <UpcomingFreeSessions cid={owner?.cid} />
        {/* Separator */}
        <Separator className="w-11/12 max-w-96 mx-auto" />
        {/* free sessions timings */}
        <OwnerFreeSessions
          author={author}
          cid={owner?.cid}
          activeWeek={freesession?.activeWeek}
          status={freesession?.status}
        />
      </div>
    </Section>
  );
}
