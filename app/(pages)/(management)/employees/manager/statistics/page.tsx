// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import Statistics from "@/app/_components/management/layout/statistics";

// lib
import { timeZone } from "@/lib/site/time";

export default async function Page() {
  // time
  const time = await timeZone();
  // if not
  if (!time || !time.date) return <WrongPage />;
  // return
  return <Statistics date={time.date} lang="ar" />;
}
