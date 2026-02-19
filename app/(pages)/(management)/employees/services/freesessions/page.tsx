"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import AllFreeSessions from "@/app/_components/management/layout/freesession";

// prisma data
import { getAllFreeSessions } from "@/data/freesession";

// lib
import { timeZone } from "@/lib/site/time";
import { roleServer } from "@/lib/auth/server";

export default async function Page() {
  // get sessions
  const sessions = await getAllFreeSessions();

  // date
  const { time, date } = timeZone();

  // role
  const role = await roleServer();

  // if not exist
  if (!sessions || !date || !time || !role) return <WrongPage />;

  // return
  return <AllFreeSessions sessions={sessions} date={date} time={time} role={role} />;
}
