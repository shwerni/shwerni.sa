// component
import { Section } from "@/components/legacy/layout/section";
import { Btitle } from "@/components/legacy/layout/titles";
import UserSettings from "@/components/legacy/layout/settings";
import { Separator } from "@/components/ui/separator";
import { PleadingOptIn } from "@/components/consultant/pleadings/opt-in";

// lib
import { timeZone } from "@/utils/date";
import { userServer } from "@/lib/auth/server";

// prisma data
import { getUserById } from "@/data/user";
import { getOwnerbyAuthor } from "@/data/consultant";

// prisma types
import { Categories } from "@/lib/generated/prisma/enums";

export default async function Page() {
  // userId
  const userId = await userServer();

  // user, and the consultant for the LAW-only pleading switch
  const [user, consultant] = await Promise.all([
    getUserById(String(userId?.id)),
    userId?.id ? getOwnerbyAuthor(userId.id) : null,
  ]);

  // time
  const { time, date } = await timeZone();

  // return
  return (
    <Section>
      {/* title */}
      <Btitle title="اعدادات الحساب" subtitle="المعلومات الاساسية للحساب" />
      {/* profile form */}
      <UserSettings user={user} time={time} date={date} />
      {/* pleading requests opt-in (LAW consultants only) */}
      {consultant?.category === Categories.LAW && (
        <div className="flex flex-col gap-10 mb-10">
          <Separator className="w-10/12 mx-auto" />
          <PleadingOptIn enabled={consultant.pleadingEnabled} />
        </div>
      )}
    </Section>
  );
}
