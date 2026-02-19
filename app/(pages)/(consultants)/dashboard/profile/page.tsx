// component
import { Section } from "@/app/_components/layout/section";
import { Btitle } from "@/app/_components/layout/titles";
import UserSettings from "@/app/_components/layout/settings";

// lib
import { timeZone } from "@/lib/site/time";
import { userServer } from "@/lib/auth/server";

// prisma data
import { getUserById } from "@/data/user";

export default async function Page() {
  // userId
  const userId = await userServer();

  // user
  const user = await getUserById(String(userId?.id));

  // time
  const { time, date } = await timeZone();

  // return
  return (
    <Section>
      {/* title */}
      <Btitle title="اعدادات الحساب" subtitle="المعلومات الاساسية للحساب" />
      {/* profile form */}
      <UserSettings user={user} time={time} date={date} />
    </Section>
  );
}
