"use client";
// React & Next
import Link from "next/link";
import { usePathname } from "next/navigation";

// components
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

// utils
import { cn } from "@/utils/utils";

// icons
import {
  Building2,
  ExternalLink,
  LayoutDashboard,
  MoreHorizontal,
  Palette,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

// the dashboard sections. the mobile bar shows the first three; the rest live under "المزيد"
const MAIN: NavItem[] = [
  { href: "/center", label: "نظرة عامة", icon: LayoutDashboard },
  { href: "/center/orders", label: "الطلبات", icon: ReceiptText },
  { href: "/center/profile", label: "الملف", icon: Building2 },
];
const MORE: NavItem[] = [
  { href: "/center/theme", label: "المظهر", icon: Palette },
];

// /center is active only on itself; a section is active on itself and its sub pages
const isActive = (pathname: string, href: string) =>
  href === "/center"
    ? pathname === "/center"
    : pathname === href || pathname.startsWith(`${href}/`);

// desktop sidebar: every section plus a link to the public page
export function CenterSidebarNav({ publicHref }: { publicHref: string }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="لوحة المركز">
      {[...MAIN, ...MORE].map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
              active
                ? "bg-(--center-accent) font-medium text-(--center-primary)"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <item.icon className="size-[18px]" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}
      <Link
        href={publicHref}
        target="_blank"
        className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
      >
        <ExternalLink className="size-[18px]" strokeWidth={1.75} />
        عرض صفحة المركز
      </Link>
    </nav>
  );
}

// mobile: a bottom bar with the three main sections and "المزيد" (a sheet with the rest)
export function CenterBottomNav({ publicHref }: { publicHref: string }) {
  const pathname = usePathname();
  const moreActive = MORE.some((i) => isActive(pathname, i.href));

  const tab = (active: boolean) =>
    cn(
      "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] transition",
      active ? "font-medium text-(--center-primary)" : "text-muted-foreground",
    );

  return (
    <nav
      aria-label="لوحة المركز"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border/70 bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
    >
      {MAIN.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={tab(active)}
          >
            <item.icon className="size-5" strokeWidth={1.75} />
            {item.label}
          </Link>
        );
      })}

      <Sheet>
        <SheetTrigger className={tab(moreActive)}>
          <MoreHorizontal className="size-5" strokeWidth={1.75} />
          المزيد
        </SheetTrigger>
        <SheetContent side="bottom" className="rounded-t-2xl pb-[calc(1rem+env(safe-area-inset-bottom))]">
          <SheetHeader>
            <SheetTitle className="text-start">المزيد</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-4">
            {MORE.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm hover:bg-muted"
              >
                <item.icon className="size-[18px]" strokeWidth={1.75} />
                {item.label}
              </Link>
            ))}
            <Link
              href={publicHref}
              target="_blank"
              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-muted-foreground hover:bg-muted"
            >
              <ExternalLink className="size-[18px]" strokeWidth={1.75} />
              عرض صفحة المركز
            </Link>
          </div>
        </SheetContent>
      </Sheet>
    </nav>
  );
}
