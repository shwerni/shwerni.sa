// React & Next
import Error404 from "@/components/shared/error-404";
import { zdencryption } from "@/utils/admin/encryption";
import { Metadata } from "next";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - الاجتماع",
  description: "shwerni payment - شاورني صفحة الاجتماع",
};

// return
export default async function ZMeeting({
  params,
}: {
  params: Promise<{ zid: string }>;
}) {
  // zid
  const { zid } = await params;

  // get zdencrypt oid
  const fid = zdencryption(String(zid));

  // validate
  if (!fid) return <Error404 />;

  return;

  // get consultant
  // const session = await getFreeSessionByFid(fid);

  // if not exist
  // if (!session) return <Error404 />;

  // return
  // return <FreeSessionMeeting session={session} time={time} date={date} />;
}
