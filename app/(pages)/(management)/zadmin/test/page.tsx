"use server";
// compoennts
import Ztest from "@/app/_components/management/admin/ztest";

// utils
import { timeZone } from "@/lib/site/time";

// return
export default async function Test() {
  // date
  const { date, time } = timeZone();

  // return
  return <Ztest iTime={{ time, date }} />;
}
