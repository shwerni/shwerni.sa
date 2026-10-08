// React & Next
import { Suspense } from "react";
import type { Metadata } from "next";

// components
import Error404 from "@/components/shared/error-404";
import ErrorVerify from "@/components/shared/error-verify";
import PageLoading from "@/components/shared/page-loading";

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

// the session check reads request data, so it runs inside suspense (the spinner shows meanwhile)
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Suspense fallback={<PageLoading />}>
      <UserGate>{children}</UserGate>
    </Suspense>
  );
}

// signed-in, phone-verified users only
async function UserGate({ children }: { children: React.ReactNode }) {
  // user
  const user = await userServer();
  // user role
  const role = user?.role;
  // if user not logged in
  if (!user || role !== UserRole.USER) return <Error404 />;
  // is user verified
  const isVerified = await getUserById(user?.id ?? "");
  // if not verified
  if (!isVerified?.phoneVerified)
    return <ErrorVerify phone={isVerified?.phone ?? ""} />;
  // if consulant
  return children;
}
