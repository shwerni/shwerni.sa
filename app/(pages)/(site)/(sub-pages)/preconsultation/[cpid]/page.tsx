// React & Next
import { Metadata } from "next";

// componenets
import Error404 from "@/components/shared/error-404";

// utils
import { decryptToken } from "@/utils/admin/encryption";

// hooks
import { roleServer } from "@/lib/auth/server";
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getUserById } from "@/data/user";
import { getPreConsultationSeassion } from "@/data/preconsultation";

// prisma types

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - ملخص الاستشارة",
  description: "shwerni brief - شاورني ملخص الاستشارة",
};

// default
export default async function PreConsultationSession({
  params,
}: {
  params: Promise<{ cpid: string }>;
}) {
  // cpid
  const { cpid } = await params;

  return <Error404 />;

  // role
  // const role = await roleServer();

  // pid
  // const pid = decryptToken(cpid);

  // order
  // const session = await getPreConsultationSeassion(pid);

  // if not exist
  // if (!session) return <Error404 />;

  // get advisor
  // const adviosr = await getUserById(session.advisor ?? "");

  // is adviosr
  // const isAdvisor = role === UserRole.COORDINATOR;

  // return
  // return (
  //   <PreConsultation
  //     pid={pid}
  //     session={session}
  //     advisor={adviosr}
  //     isAdvisor={isAdvisor}
  //   />
  // );
}
