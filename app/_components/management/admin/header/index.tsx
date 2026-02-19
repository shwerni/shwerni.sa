"use server";
// React & Next
import Link from "next/link";

// components
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/app/_components/layout/theme/btn";

// icons
import { CalendarIcon, Home } from "lucide-react";

// aml card
function Aml() {
  return (
    <HoverCard>
      <HoverCardTrigger>
        <div className="cflex w-9 h-9 bg-zblue-200 rounded-full">
          <h3 className="font-medium text-white text-2xl pt-0.5">A</h3>
        </div>
      </HoverCardTrigger>
      <HoverCardContent className="w-fit" align="end">
        <div className="flex justify-between">
          <div className="cflex w-10 h-10 bg-zgrey-50 rounded-full">
            <h3 className="font-medium text-zblue-200 text-base">aml</h3>
          </div>
          <div className="space-y-1" dir="rtl">
            <h4 className="text-sm font-semibold">جنتي</h4>
            <p className="text-sm">امل كل حياتي</p>
            <div className="flex items-center pt-2 gap-1">
              <span className="text-xs text-muted-foreground">
                Joined December 1974
              </span>
              <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}

// return
export default async function AdminHeader() {
  // return
  return (
    <div className="flex flex-row items-start justify-between w-[99%] my-3 transition-[width,height]">
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
      <div className="rflex gap-4">
        {/* toggle theme */}
        <ThemeToggle />
        {/* aml avatar */}
        <Aml />
      </div>
    </div>
  );
}
