"use server";
// components
import { EmployeeMeetings } from "@/app/_components/management/layout/meetings";

// prsima types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { timeZone } from "@/lib/site/time";

export default async function Page() {
  // date
  const { date, time } = timeZone();

  // return
  return (
    <EmployeeMeetings
      lang="ar"
      role={UserRole.MANAGER}
      date={date}
      time={time}
    />
  );
}
