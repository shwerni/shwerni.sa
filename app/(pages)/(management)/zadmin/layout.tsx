// React & Next
import type { Metadata } from "next";

// prisma types
import { UserRole } from  "@/lib/generated/prisma/enums";

// lib
import { roleServer } from "@/lib/auth/server";

// components
import RoleError from "@/app/_components/layout/zErrors/auth/role";
import AdminHeader from "@/app/_components/management/admin/header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import AdminSideBar from "@/app/_components/management/admin/header/sidebar";

// meta data seo
export const metadata: Metadata = {
  title: "shwerni- az",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // user role
  const role = await roleServer();

  // if admin
  if (role === UserRole.ADMIN)
    return (
      <SidebarProvider defaultOpen={false}>
        {/* sidebar */}
        <AdminSideBar />
        {/* main body */}
        <SidebarInset >
          {/* header */}
          <AdminHeader />
          {/* main */}
          <div className="flex flex-1 flex-col justify-between gap-4 w-full max-w-[2000px] mt-5 p-4 pt-0">
            {/* children */}
            {children}
            {/* footor */}
            <div className="rflex my-2">
              <h6>by ziadAboalmajd copyright © AZ</h6>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );

  // erorr page for user
  return <RoleError role={UserRole.ADMIN} />;
}
