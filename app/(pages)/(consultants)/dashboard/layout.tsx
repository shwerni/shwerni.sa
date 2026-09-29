// React & Next
import type { Metadata } from "next";

// components
import Footer from "@/components/clients/footer";
import Header from "@/components/legacy/consultants/header";
import RoleError from "@/components/legacy/layout/zErrors/auth/role";
import ConsultantOath from "@/components/legacy/consultants/owner/oath";
import WrongPage from "@/components/legacy/layout/zErrors/site/wrongPage";
import PleaseVerify from "@/components/legacy/layout/zErrors/auth/verify";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getUserById } from "@/data/user";
import { getOwnerbyAuthor } from "@/data/consultant";
import { getAuthStateById } from "@/data/admin/tools/oath";
import UploadThingWrapper from "@/components/wrappers/uploadthing";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - لوحة التحكم",
  description: "شاورني - لوحة تحكم المستشار - shwerni consultant dashboard",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // user
  const user = await userServer();
  // if user not logged in
  if (!user || !user.id) return <WrongPage />;

  // role comes from the session token — check it before any db query,
  // so non-consultants get the error page without hitting the database
  if (user.role !== UserRole.OWNER) return <RoleError role={UserRole.OWNER} />;

  // the three lookups only depend on the user id, so run them in parallel
  const [dbUser, oath, consultant] = await Promise.all([
    getUserById(user.id),
    getAuthStateById(user.id),
    getOwnerbyAuthor(user.id),
  ]);

  // if not verified
  if (!dbUser?.phoneVerified)
    return <PleaseVerify phone={dbUser?.phone ?? ""} />;

  return (
    <main className="flex-1 flex flex-col justify-between max-w-7xl min-h-screen m-auto">
      {/* uplaod thing */}
      <UploadThingWrapper>
        {/* dashboard */}
        <div>
          {/* header */}
          <Header />
          {/* children */}
          {!consultant ? (
            children
          ) : oath ? (
            children
          ) : (
            <ConsultantOath id={user.id} />
          )}
        </div>
      </UploadThingWrapper>
      {/* footer */}
      <Footer />
    </main>
  );
}
