// React & Next
import Link from "next/link";

// components
import { Separator } from "@/components/ui/separator";
import { SheetClose } from "@/components/ui/sheet";

// utils
import { cn } from "@/lib/utils";
import { findUser } from "@/utils";

// lib
import { UserRole } from "@/lib/generated/prisma/enums";

// types
import { Link as LinkType } from "@/types/layout";

// constant
import { menu } from "@/constants/menu";

// icons
import { Settings } from "lucide-react";

// auth
import { User } from "next-auth";

// props
interface SideBarBtnProps {
  item: LinkType;
  className?: string;
  active?: boolean;
}

// submenu props
interface SubMenuProps {
  user: User;
}

// sub menu content
export const SubMenu = ({ user }: SubMenuProps) => {
  // dashboard
  const dashboard: UserRole[] = [
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.MARKETER,
    UserRole.SERVICE,
    UserRole.COORDINATOR,
    UserRole.COLLABORATOR,
  ];

  // user
  if (user?.role === UserRole.USER)
    return (
      <>
        {menu.map(
          (i, index) => i.status && <SideBarBtn key={index} item={i} />,
        )}
        <Separator className="w-1/2 mx-auto bg-zgrey-50" />
      </>
    );

  // if owner consultant or  centers consultant
  if (user?.role === UserRole.OWNER)
    return (
      <>
        {/* dashboard */}
        <Link
          href="/dashboard"
          className="flex items-center gap-1 py-2 px-3 rounded-md"
        >
          <Settings className="ml-2 h-4 w-4" />
          <span>لوحة التحكم</span>
        </Link>
        <Separator className="w-1/2 mx-auto bg-zgrey-50" />
      </>
    );

  // if owner or consultant or centers
  if (user?.role === UserRole.GROUP)
    return (
      <>
        {/* dashboard */}
        <Link
          href="/c.dashboard"
          className="flex items-center gap-1 py-2 px-3 rounded-md"
        >
          <Settings className="ml-2 h-4 w-4" />
          <span>لوحة التحكم</span>
        </Link>
        <Separator className="w-1/2 mx-auto bg-zgrey-50" />
      </>
    );

  // admin or management accounts
  if (dashboard.includes(user?.role as UserRole)) {
    // url according to the role
    const url = findUser(user?.role)?.url ?? "/";
    // admin
    return (
      <Link href={url} className="flex items-center gap-1 py-2 px-3 rounded-md">
        <Settings className="ml-2 h-4 w-4" />
        <span>لوحة التحكم</span>
      </Link>
    );
  }
};

// sidebar button
export function SideBarBtn({ item, className, active }: SideBarBtnProps) {
  return (
    <SheetClose asChild>
      <Link
        href={item.link}
        className={cn([
          className,
          active && "bg-white",
          "flex items-center gap-1 py-2 px-3 rounded-md",
        ])}
      >
        <item.icon className="ml-2 h-4 w-4" />
        <span>{item.label}</span>
      </Link>
    </SheetClose>
  );
}
