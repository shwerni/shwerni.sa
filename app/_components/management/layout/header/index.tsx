"use server";
// React & Next
import Link from "next/link";
import Image from "next/image";

// components
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// lib
import { userServer } from "@/lib/auth/server";

// icons
import { Home } from "lucide-react";

// return
export default async function ManagementHeader() {
  // session
  const user = await userServer();
  // username
  const name = user && user.name ? user.name[0] : "user";
  // return
  return (
    <div className="flex flex-row items-center justify-between w-[99%] my-3 transition-[width,height]">
      {/* sidebar header */}
      <div className="rflex gap-1">
        {/* sidebar trigger */}
        <SidebarTrigger className="w-5 m-3 text-zgrey-200" />
        {/* separator */}
        <Separator className="h-6 w-0.5" orientation="vertical" />
        {/* home icon to "/" */}
        <Link href="/" className="cflex w-7 h-7 mx-3">
          <Home className="w-5 text-zgrey-200" />
        </Link>
      </div>
      {/* logo & user's avatar */}
      <div className="rflex gap-2">
        {/* logo */}
        <Image
          className="w-24 sm:w-32"
          src="/layout/logo2.png"
          alt="logo"
          width={160}
          height={160}
          priority={true}
          sizes="(max-width: 640px) 128px, 256px"
        />
        {/* avatar */}
        <Avatar className="h-8 w-8 rounded-lg mx-3">
          <AvatarImage src={name[0]} alt={name[0]} />
          <AvatarFallback className="rounded-full uppercase bg-slate-200">
            {name[0]}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
}
