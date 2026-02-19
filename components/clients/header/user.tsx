"use client";

import Link from "next/link";
import { User } from "next-auth";
import { ChevronDown, User2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { menu, cdashboard } from "@/constants/menu";
import { UserRole } from "@/lib/generated/prisma/enums";

interface Props {
  user?: User & { role?: string };
}

const UserNav = ({ user }: Props) => {
  const src = user?.image || "";
  const role = user?.role;

  const isOwner = role === UserRole.OWNER;
  const isClient = role === UserRole.USER;

  const links = isOwner ? cdashboard : isClient ? menu : [];

  // If no valid role → just show avatar
  if (!isOwner && !isClient) {
    return (
      <Avatar>
        <AvatarImage src={src} />
        <AvatarFallback className="bg-blue-50">
          <User2 className="w-5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer">
          <Avatar>
            <AvatarImage src={src} />
            <AvatarFallback className="bg-blue-50">
              <User2 className="w-5" />
            </AvatarFallback>
          </Avatar>
          <ChevronDown className="w-4" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel>
          {isOwner ? "لوحة التحكم" : "حسابي"}
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuGroup>
          {links
            .filter((item) => item.status)
            .map((item, index) => {
              const Icon = item.icon;

              return (
                <DropdownMenuItem key={index} asChild>
                  <Link
                    href={`${isOwner ? "/dashboard/" : ""}${item.link}`}
                    className="flex items-center justify-between w-full"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                  </Link>
                </DropdownMenuItem>
              );
            })}
        </DropdownMenuGroup>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/logout">تسجيل الخروج</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserNav;
