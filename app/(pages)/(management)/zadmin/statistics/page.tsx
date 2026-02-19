// components
import Statistics from "@/app/_components/management/layout/statistics";

// lib
import { timeZone } from "@/lib/site/time";

export default async function Page() {
  // time
  const { date } = timeZone();
  // return
  return <Statistics date={date} />;
}
