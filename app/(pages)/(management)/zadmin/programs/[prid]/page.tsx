"use server";
// components
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import EditProgram from "@/app/_components/management/layout/programs/editProgram";

// prisma data
import { getProgramByPridAdmin } from "@/data/admin/program";

// hooks
import { roleServer } from "@/lib/auth/server";

export default async function Page({
  params,
}: {
  params: Promise<{ prid: string }>;
}) {
  // oid
  const { prid } = await params;

  // get programs
  const program = await getProgramByPridAdmin(Number(prid));

  // role
  const role = await roleServer();

  // if not exist
  if (!program || !role) return <WrongPage />;

  // return
  return <EditProgram program={program} role={role} />;
}
