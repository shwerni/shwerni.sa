// React & Next
import { Metadata } from "next";

// components
import Meetings from "@/components/clients/freesessions/meetings";
import Error404 from "@/components/shared/error-404";

// lib
import { timeZone } from "@/lib/site/time";

// utils
import { zdencryption } from "@/utils/admin/encryption";
import { getFreeSessionByFid } from "@/data/freesession";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// props
type Props = {
  params: Promise<{ zid: string }>;
};

// return
export default async function Page({ params }: Props) {
  // zid
  const { zid } = await params;

  // get zdencrypt oid
  const fid = zdencryption(String(zid));

  // validate
  if (!fid) return <Error404 />;

  // get consultant
  const freesession = await getFreeSessionByFid(fid);

  // if not exist
  if (!freesession) return <Error404 />;

  // time and date
  const { date, time } = timeZone();

  // return
  return (
    <Meetings zid={zid} freesession={freesession} time={time} date={date} />
  );
}
