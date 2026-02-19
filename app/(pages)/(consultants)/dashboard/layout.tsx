// React & Next
import type { Metadata } from "next";

// components
import Header from "@/app/_components/consultants/header";
import Footer from "@/app/_components/consultants/footer";
import RoleError from "@/app/_components/layout/zErrors/auth/role";
import ConsultantOath from "@/app/_components/consultants/owner/oath";
import WrongPage from "@/app/_components/layout/zErrors/site/wrongPage";
import PleaseVerify from "@/app/_components/layout/zErrors/auth/verify";

// lib
import { userServer } from "@/lib/auth/server";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma data
import { getUserById } from "@/data/user";
import { getAuthStateById } from "@/data/admin/tools/oath";
import { getOwnerbyAuthor } from "@/data/consultant";

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
  // is user verified
  const isVerified = await getUserById(user?.id ?? "");
  // if not verified
  if (!isVerified?.phoneVerified)
    return <PleaseVerify phone={isVerified?.phone ?? ""} />;
  // check oath acceptance
  const oath = await getAuthStateById(user.id);
  // consultant exist
  const consultant = await getOwnerbyAuthor(user.id);
  // if consulant
  if (user?.role === UserRole.OWNER)
    return (
      <main className="flex-1 flex flex-col justify-between max-w-7xl min-h-screen m-auto">
        {/* dashboard */}
        <div>
          {/* header */}
          <Header />
          {/* children */}
          {
            !consultant ? (
              children
            ) : oath ? (
              children
            ) : (
              <ConsultantOath id={user.id} />
            )
          }
        </div>
        {/* footer */}
        <Footer />
      </main>
    );
  // erorr page for user
  return <RoleError role={UserRole.OWNER} />;
}
