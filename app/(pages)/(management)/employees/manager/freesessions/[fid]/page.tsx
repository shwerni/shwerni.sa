"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";

// prisma data
import { getFreeSessionByFid } from "@/data/freesession";

// hooks
import { roleServer } from "@/lib/auth/server";
import EditFreeSession from "@/app/_components/management/layout/freesession/editSession";

export default async function Page({
  params,
}: {
  params: Promise<{ fid: string }>;
}) {
  // oid
  const { fid } = await params;

  // get sessions
  const session = await getFreeSessionByFid(Number(fid));

  // role
  const role = await roleServer();

  // if not exist
  if (!session || !role) return <WrongPage />;

  // return
  return <EditFreeSession session={session} role={role} />;
}
