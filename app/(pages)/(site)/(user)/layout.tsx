// React & Next
import type { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import ErrorVerify from "@/components/shared/error-verify";

// lib
import { userServer } from "@/lib/auth/server";
import { UserRole } from "@/lib/generated/prisma/enums";

// prisma types

// prisma data
import { getUserById } from "@/data/user";

// meta data seo
export const metadata: Metadata = {
  title: "شاورني - المستخدم",
  description: "شاورني  المستخدم- shwerni - user",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // user
  const user = await userServer();
  // user role
  const role = user?.role;
  // if user not logged in
  if (!user) return <Error404 />;
  // is user verified
  const isVerified = await getUserById(user?.id ?? "");
  // if not verified
  if (!isVerified?.phoneVerified)
    return <ErrorVerify phone={isVerified?.phone ?? ""} />;
  // if consulant
  if (role === UserRole.USER) return children;
}
