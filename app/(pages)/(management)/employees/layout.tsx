// React & Next
import type { Metadata } from "next";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// lib
import { userServer } from "@/lib/auth/server";

// components
import RoleError from "@/app/_components/layout/zErrors/auth/role";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import ManagementHeader from "@/app/_components/management/layout/header";
import { getSidebarByRole } from "@/app/_components/management/layout/sidebars";

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
  if (
    !user ||
    !user.role ||
    ![
      UserRole.ADMIN as string,
      UserRole.MANAGER as string,
      UserRole.MARKETER as string,
      UserRole.SERVICE as string,
      UserRole.COORDINATOR as string,
    ].includes(user.role as UserRole)
  )
    return <RoleError role={UserRole.MANAGER} />;

  // if admin
  return (
    <SidebarProvider defaultOpen={false}>
      {/* sidebar */}
      {getSidebarByRole(user.role, user.name ?? "")}
      {/* main body */}
      <SidebarInset >
        {/* header */}
        <ManagementHeader />
        {/* main */}
        <div className="flex flex-1 flex-col justify-between gap-4 w-full max-w-[2000px] mt-5 sm:p-4 pt-0">
          {/* children */}
          {children}
          {/* footor */}
          <div className="rflex my-2">
            <h6>by ziadAboalmajd © AZ</h6>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
