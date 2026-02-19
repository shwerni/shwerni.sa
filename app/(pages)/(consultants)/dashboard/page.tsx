// components
import { Btitle } from "@/app/_components/layout/titles";
import { Section } from "@/app/_components/layout/section";
import ConsultantPopUp from "@/app/_components/consultants/popup/intro";
import ErrorRefresh from "@/app/_components/layout/zErrors/site/refresh";
import CoProfileForm from "@/app/_components/consultants/owner/profile/form";

// lib
import { userServer } from "@/lib/auth/server";

// data
import { getOwnerbyAuthor } from "@/data/consultant";

export default async function Page() {
  // user
  const user = await userServer();
  // if user not exist
  if (!user || !user.id || !user.phone) return <ErrorRefresh />;
  // get consultant page
  const consultant = await getOwnerbyAuthor(user.id);
  // return
  return (
    <Section>
      {/* title */}
      <Btitle title="ملفك الشخصي" />
      {/* pop up */}
      {consultant && (
        <ConsultantPopUp gender={consultant?.gender} name={consultant?.name} />
      )}
      {/* form */}
      <CoProfileForm author={user.id} owner={consultant} phone={user.phone} />
    </Section>
  );
}
