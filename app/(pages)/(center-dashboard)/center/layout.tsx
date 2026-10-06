// React & Next
import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";

// components
import RoleError from "@/components/legacy/layout/zErrors/auth/role";
import { CenterLogo } from "@/components/clients/centers/center-logo";
import { CenterShell } from "@/components/clients/centers/center-shell";
import { CenterBottomNav, CenterSidebarNav } from "@/components/center-dashboard/nav";

// prisma data
import { requireCenter } from "@/data/center/require-center";
import { getCenterSettings } from "@/data/center/dashboard";

// prisma types
import { UserRole } from "@/lib/generated/prisma/enums";

// the dashboard is private: never indexed
export const metadata: Metadata = {
  title: "لوحة المركز",
  robots: { index: false, follow: false },
};

// the mobile bottom bar sits above the iphone home indicator
export const viewport: Viewport = { viewportFit: "cover" };

// center dashboard (centers spec §11): its own chrome, no shwerni navbar. only a signed-in
// CENTER account with a membership gets in (the proxy already sends guests to /login)
export default async function CenterDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const ctx = await requireCenter().catch(() => null);
  if (!ctx) return <RoleError role={UserRole.CENTER} />;

  const center = await getCenterSettings(ctx.centerId);
  if (!center) return <RoleError role={UserRole.CENTER} />;

  const publicHref = `/centers/${center.slug}`;

  return (
    <CenterShell themeKey={center.themeKey} themeVars={center.themeVars} preview={false}>
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-8 px-4 pb-[calc(5rem+env(safe-area-inset-bottom))] pt-6 lg:pb-10">
        {/* desktop sidebar */}
        <aside className="hidden w-60 shrink-0 lg:block">
          <div className="sticky top-6 flex flex-col gap-6">
            <div className="flex items-center gap-3 px-1">
              <CenterLogo name={center.name} logo={center.logo} size={40} className="rounded-xl" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{center.name}</p>
                <p className="text-xs text-muted-foreground">لوحة المركز</p>
              </div>
            </div>
            <CenterSidebarNav publicHref={publicHref} />
          </div>
        </aside>

        {/* page */}
        <main className="min-w-0 flex-1">
          {/* mobile header */}
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <CenterLogo name={center.name} logo={center.logo} size={36} className="rounded-xl" />
            <p className="truncate font-semibold">{center.name}</p>
          </div>
          {children}
        </main>
      </div>

      <CenterBottomNav publicHref={publicHref} />
    </CenterShell>
  );
}
