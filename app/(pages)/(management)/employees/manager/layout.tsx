// React & Next
import type { Metadata } from "next";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { userServer } from "@/lib/auth/server";

// components
import RoleError from "@/app/_components/layout/zErrors/auth/role";

// meta data seo
export const metadata: Metadata = {
  title: "shwerni",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // user role
  const user = await userServer();

  // erorr page for user
  if (!user || !user.role || user.role !== UserRole.MANAGER)
    return <RoleError role={UserRole.MANAGER} />;

  // return
  return children;
}
